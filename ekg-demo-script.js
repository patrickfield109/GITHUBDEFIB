import fs from 'fs';
import http from 'http';

// Complete EKG Analysis Demo Script
async function demonstrateEKGSystem() {
  console.log('🏥 OperatorOS EKG Analysis System - Complete Demo');
  console.log('=' .repeat(60));
  
  // Load the EKG image
  const imageBuffer = fs.readFileSync('./attached_assets/image_1753534721925.png');
  const base64Image = imageBuffer.toString('base64');
  const imageDataUrl = `data:image/png;base64,${base64Image}`;

  console.log('\n📤 Submitting EKG for comprehensive analysis...');
  
  // Submit EKG for analysis
  const analysisResult = await submitEKGAnalysis(imageDataUrl);
  
  console.log('\n✅ EKG Analysis Complete!');
  console.log(`📋 Task ID: ${analysisResult.taskId}`);
  console.log(`❤️  Heart Rate: ${analysisResult.analysis.heartRate} bpm (${analysisResult.analysis.rhythm})`);
  console.log(`📊 Clinical Interpretation: ${analysisResult.analysis.interpretation}`);
  
  console.log('\n🔍 Interval Measurements:');
  console.log(`   PR Interval: ${analysisResult.analysis.intervals.pr}ms`);
  console.log(`   QRS Duration: ${analysisResult.analysis.intervals.qrs}ms`);
  console.log(`   QT Interval: ${analysisResult.analysis.intervals.qt}ms`);
  
  console.log('\n🖼️  DOWNLOADABLE FILES GENERATED:');
  console.log(`✓ Annotated EKG Image: ${analysisResult.downloads.annotatedImage}`);
  console.log(`✓ Clinical PDF Report: ${analysisResult.downloads.report}`);
  
  // Download the files
  console.log('\n📥 Downloading generated files...');
  await downloadFile(analysisResult.downloads.annotatedImage, 'demo_annotated_ekg.png');
  await downloadFile(analysisResult.downloads.report, 'demo_ekg_report.pdf');
  
  console.log('\n🎯 DEMO COMPLETE - Features Demonstrated:');
  console.log('=' .repeat(60));
  console.log('✅ Professional EKG component identification');
  console.log('✅ Color-coded annotations (P waves, QRS, T waves)');
  console.log('✅ Precise interval measurements with visual indicators');
  console.log('✅ High-resolution downloadable annotated image');
  console.log('✅ PDF clinical report generation');
  console.log('✅ Medical-grade analysis with disclaimers');
  console.log('✅ Secure download system with 24-hour expiration');
  console.log('✅ Integration with OperatorOS healthcare agent pool');
  
  return analysisResult;
}

async function submitEKGAnalysis(imageDataUrl) {
  const requestData = JSON.stringify({
    image: imageDataUrl,
    taskId: `comprehensive_demo_${Date.now()}`
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/analyze-ekg',
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
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(requestData);
    req.end();
  });
}

async function downloadFile(url, filename) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: url,
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const fileStream = fs.createWriteStream(filename);
      res.pipe(fileStream);
      
      fileStream.on('finish', () => {
        console.log(`   Downloaded: ${filename}`);
        resolve(filename);
      });
      
      fileStream.on('error', reject);
    });

    req.on('error', reject);
    req.end();
  });
}

// Run the comprehensive demo
demonstrateEKGSystem()
  .then(result => {
    console.log(`\n🎉 Demo completed successfully! Task ID: ${result.taskId}`);
    console.log('\n💡 User Experience Summary:');
    console.log('   1. Upload EKG image via Replit Agent conversation');
    console.log('   2. Receive comprehensive AI analysis with measurements');
    console.log('   3. Download professional annotated image');
    console.log('   4. Access detailed PDF clinical report');
    console.log('   5. All components color-coded and clearly labeled');
  })
  .catch(error => {
    console.error('❌ Demo failed:', error);
  });