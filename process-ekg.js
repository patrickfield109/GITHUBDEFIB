const fs = require('fs');
const fetch = require('node-fetch');

async function processEKGImage() {
  try {
    // Read the uploaded EKG image
    const imageBuffer = fs.readFileSync('./attached_assets/image_1753534668877.png');
    const base64Image = imageBuffer.toString('base64');
    const imageDataUrl = `data:image/png;base64,${base64Image}`;

    // Comprehensive EKG analysis request
    const analysisRequest = {
      type: "medical_analysis",
      input: {
        type: "ekg_analysis",
        image: imageDataUrl,
        description: "12-lead EKG for comprehensive cardiac evaluation",
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
          "Identify P waves, QRS complexes, T waves in all leads",
          "Calculate PR interval, QT interval, QRS width, heart rate",
          "Assess for ST elevation/depression, Q waves, T wave inversions",
          "Evaluate axis deviation and conduction blocks",
          "Provide clinical interpretation with potential diagnoses"
        ]
      }
    };

    console.log('Submitting EKG image for comprehensive analysis...');
    
    // Submit to OperatorOS
    const response = await fetch('http://localhost:5000/api/submit-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(analysisRequest)
    });

    const result = await response.json();
    console.log('EKG Analysis Task Created:', result);
    
    return result.taskId;
  } catch (error) {
    console.error('Error processing EKG:', error);
    throw error;
  }
}

// Run the analysis
processEKGImage().then(taskId => {
  console.log(`EKG analysis submitted with task ID: ${taskId}`);
}).catch(console.error);