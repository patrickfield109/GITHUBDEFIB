// Demo script to show EKG analysis submission
// This demonstrates how to submit an EKG image for comprehensive analysis

const fs = require('fs');
const path = require('path');

async function submitEKGForAnalysis(imagePath) {
  try {
    // Read and encode the image
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

    // Prepare the analysis request
    const analysisRequest = {
      type: "medical_analysis",
      input: {
        type: "ekg_analysis",
        image: imageDataUrl,
        requestedAnalysis: {
          componentIdentification: true,
          rhythmAnalysis: true,
          abnormalityDetection: true,
          clinicalInterpretation: true,
          labeledImageGeneration: true
        },
        analysisDepth: "comprehensive",
        medicalContext: "cardiology_evaluation"
      }
    };

    // Submit to OperatorOS healthcare agent pool
    const response = await fetch('http://localhost:5000/api/submit-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(analysisRequest)
    });

    const result = await response.json();
    console.log('EKG Analysis Submitted:', result);
    
    return result;
  } catch (error) {
    console.error('Error submitting EKG for analysis:', error);
    throw error;
  }
}

// Example usage (uncomment when you have an EKG image):
// submitEKGForAnalysis('./path/to/your/ekg-image.png');

module.exports = { submitEKGForAnalysis };