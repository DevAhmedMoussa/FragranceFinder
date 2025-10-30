// upload.cjs
const admin = require("firebase-admin");
const fs = require("fs");

// Load your service account key
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load your JSON file
const rawData = fs.readFileSync("perfumes.json");
const perfumes = JSON.parse(rawData);

console.log("Total perfumes:", perfumes.length);

// Firestore batch size - keep it <= 500 (Firestore limit)
const BATCH_SIZE = 100;

// === PROGRESS TRACKING FILE ===
const PROGRESS_FILE = "uploadProgress.json";

// Read progress file (if exists)
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
      return data.lastUploadedIndex || 0;
    } catch {
      return 0;
    }
  }
  return 0;
}

// Save progress
function saveProgress(index) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastUploadedIndex: index }, null, 2));
}

// Sanitize doc IDs
function safeId(id) {
  if (!id) return null;
  return id.replace(/[\/.#$[\]]/g, "_").substring(0, 150);
}

// Extract notes from description
function extractNotes(desc) {
  if (!desc) return [];
  const regex = /(top|heart|middle|base) notes? are ([^.;]+)/gi;
  const foundNotes = [];
  let match;
  while ((match = regex.exec(desc.toLowerCase())) !== null) {
    const parts = match[2].split(/,| and /).map(n => n.trim()).filter(Boolean);
    foundNotes.push(...parts);
  }
  return foundNotes;
}

// Delay helper
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Progress tracking
function showProgress(current, total, startTime) {
  const elapsed = Date.now() - startTime;
  const percent = ((current / total) * 100).toFixed(1);
  const rate = current / (elapsed / 1000);
  const remaining = Math.ceil((total - current) / rate);
  console.log(`Progress: ${current}/${total} (${percent}%) | Rate: ${rate.toFixed(1)}/sec | Est. time left: ${remaining}s`);
}

// === MAIN UPLOAD FUNCTION ===
async function uploadPerfumes() {
  const startTime = Date.now();
  let successfulUploads = 0;
  let failedUploads = 0;

  // Load saved progress
  let startIndex = loadProgress();
  if (startIndex >= perfumes.length) {
    console.log("✅ All perfumes already uploaded!");
    return;
  }

  console.log(`Resuming from perfume #${startIndex}...`);
  console.log(`Uploading ${perfumes.length - startIndex} remaining perfumes in batches of ${BATCH_SIZE}...`);

  for (let i = startIndex; i < perfumes.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = perfumes.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(perfumes.length / BATCH_SIZE);

    try {
      chunk.forEach((p, index) => {
        const globalIndex = i + index;
        const docId = safeId(p.url) || safeId(p.Name) || `perfume-${globalIndex}`;

        if (!docId) {
          console.warn(`Skipping perfume at index ${globalIndex} - no valid ID`);
          failedUploads++;
          return;
        }

        const docRef = db.collection("perfumes").doc(docId);
        batch.set(docRef, {
          id: docId,
          name: p.Name || "Unknown",
          gender: p.Gender || "Unspecified",
          notes: extractNotes(p.Description),
          rating: p["Rating Value"] || null,
          count: p["Rating Count"] || null,
          description: p.Description || "",
          image: p.url || "",
          uploadedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        successfulUploads++;
      });

      showProgress(i, perfumes.length, startTime);
      await batch.commit();

      console.log(`✓ Batch ${batchNumber}/${totalBatches} committed (${chunk.length} perfumes)`);

      // Save progress (after successful commit)
      saveProgress(i + chunk.length);

      // Delay to avoid throttling
      if (i + BATCH_SIZE < perfumes.length) {
        await delay(200);
      }

    } catch (error) {
      console.error(`✗ Failed to upload batch ${batchNumber}:`, error);
      failedUploads += chunk.length;
      console.log("Continuing with next batch...");
    }
  }

  // Upload done, reset progress
  saveProgress(perfumes.length);

  const totalTime = (Date.now() - startTime) / 1000;
  console.log("\n=== UPLOAD COMPLETE ===");
  console.log(`Successful: ${successfulUploads}`);
  console.log(`Failed: ${failedUploads}`);
  console.log(`Total time: ${totalTime.toFixed(1)} seconds`);
  console.log(`Average rate: ${(successfulUploads / totalTime).toFixed(1)} perfumes/second`);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nUpload interrupted by user');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('\nUpload terminated');
  process.exit(0);
});

uploadPerfumes().catch(console.error);
