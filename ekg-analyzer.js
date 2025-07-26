import fs from 'fs';
import http from 'http';

async function analyzeEKG() {
  try {
    // Read the EKG image
    const imageBuffer = fs.readFileSync('./attached_assets/image_1753534721925.png');
    const base64Image = imageBuffer.toString('base64');
    const imageDataUrl = `data:image/png;base64,${base64Image}`;

    // Prepare comprehensive analysis request
    const requestData = JSON.stringify({
      type: "medical_analysis",
      input: {
        type: "ekg_analysis", 
        image: imageDataUrl,
        description: "12-lead EKG requiring comprehensive cardiac evaluation",
        requestedAnalysis: {
          componentIdentification: true,
          rhythmAnalysis: true,
          abnormalityDetection: true,
          clinicalInterpretation: true,
          labeledImageGeneration: true
        },
        analysisDepth: "comprehensive",
        medicalContext: "cardiology_evaluation",
        specificRequests: [
          "Identify P waves, QRS complexes, T waves across all 12 leads",
          "Calculate precise measurements: PR interval, QT interval, QRS width, heart rate",
          "Detect abnormalities: ST elevation/depression, Q waves, T wave inversions",
          "Assess cardiac axis and identify any conduction blocks",
          "Provide differential diagnosis and clinical significance"
        ]
      }
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/submit-task',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log('✅ EKG Analysis Submitted Successfully');
            console.log(`📋 Task ID: ${result.taskId}`);
            console.log('🏥 Healthcare Agent Pool Processing...');
            resolve(result);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(requestData);
      req.end();
    });

  } catch (error) {
    console.error('❌ Error submitting EKG analysis:', error.message);
    throw error;
  }
}

// Execute analysis
analyzeEKG()
  .then(result => {
    console.log('\n🔄 Monitor analysis progress at: /api/tasks');
    console.log('📊 View results through the OperatorOS dashboard');
  })
  .catch(console.error);