const fs = require('fs');
const path = require('path');
const backgroundRemovalService = require('./services/backgroundRemoval');

async function testBackgroundRemoval() {
    try {
        console.log('🧪 Testing background removal service...');
        
        const service = backgroundRemovalService;
        
        // Test with a sample image (you can replace this with your actual image path)
        const testImagePath = path.join(__dirname, 'static/assets/images/13.png');
        
        if (fs.existsSync(testImagePath)) {
            const imageBuffer = fs.readFileSync(testImagePath);
            console.log(`📁 Loading test image: ${testImagePath}`);
            console.log(`📊 Original image size: ${imageBuffer.length} bytes`);
            
            const result = await service.removeBackgroundFromBuffer(imageBuffer, '13.png');
            
            console.log(`✅ Background removal completed!`);
            console.log(`📊 Processed image size: ${result.length} bytes`);
            
            // Save the result
            const outputPath = path.join(__dirname, 'test-output.png');
            fs.writeFileSync(outputPath, result);
            console.log(`💾 Saved processed image to: ${outputPath}`);
            
        } else {
            console.log('❌ Test image not found. Please provide a valid image path.');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.message.includes('Unsupported format')) {
            console.log('\n🔧 SOLUTION FOR "Unsupported format" ERROR:');
            console.log('1. Ensure Sharp is properly installed: npm install sharp');
            console.log('2. If using PNG, the image may have palette/indexed colors');
            console.log('3. The updated service now converts images to RGBA PNG first');
            console.log('4. Try uploading the image through the admin dashboard');
        }
    }
}

// Run the test
testBackgroundRemoval();