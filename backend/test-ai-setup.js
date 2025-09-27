#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Test script to validate AI processing setup
 */

console.log('🔍 MediChain AI Processing Setup Validator\n');

// Test 1: Check Python installation
console.log('1. Checking Python installation...');
const pythonProcess = spawn('python3', ['--version'], { stdio: 'pipe' });

pythonProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Python 3 is installed');
    testPythonPackages();
  } else {
    console.log('❌ Python 3 is not installed or not in PATH');
    console.log('   Please install Python 3.7+ and try again');
    process.exit(1);
  }
});

pythonProcess.on('error', (error) => {
  console.log('❌ Python 3 is not available:', error.message);
  process.exit(1);
});

// Test 2: Check required Python packages
function testPythonPackages() {
  console.log('\n2. Checking Python packages...');
  
  const requiredPackages = [
    'huggingface_hub',
    'transformers',
    'paddleocr',
    'opencv-python',
    'pillow',
    'requests',
    'numpy'
  ];
  
  const testScript = `
import sys
packages = ${JSON.stringify(requiredPackages)}
missing = []

for package in packages:
    try:
        __import__(package.replace('-', '_'))
        print(f"✅ {package}")
    except ImportError:
        missing.append(package)
        print(f"❌ {package}")

if missing:
    print(f"\\nMissing packages: {', '.join(missing)}")
    print("Install with: pip install " + " ".join(missing))
    sys.exit(1)
else:
    print("\\n✅ All required packages are installed")
`;

  fs.writeFileSync('temp_test.py', testScript);
  
  const packageTest = spawn('python3', ['temp_test.py'], { stdio: 'inherit' });
  
  packageTest.on('close', (code) => {
    fs.unlinkSync('temp_test.py');
    
    if (code === 0) {
      testDirectories();
    } else {
      console.log('\n❌ Some Python packages are missing');
      console.log('Run: pip install -r requirements.txt');
      process.exit(1);
    }
  });
}

// Test 3: Check directories and permissions
function testDirectories() {
  console.log('\n3. Checking directories and permissions...');
  
  const tempDir = path.join(process.cwd(), 'temp');
  
  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log('✅ Created temp directory');
    } else {
      console.log('✅ Temp directory exists');
    }
    
    // Test write permissions
    const testFile = path.join(tempDir, 'test_write.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('✅ Write permissions OK');
    
  } catch (error) {
    console.log('❌ Directory/permission error:', error.message);
    process.exit(1);
  }
  
  testConfiguration();
}

// Test 4: Check configuration
function testConfiguration() {
  console.log('\n4. Checking configuration...');
  
  try {
    const aiServicePath = path.join(process.cwd(), 'src/modules/medical-records/ai-processing.service.ts');
    
    if (fs.existsSync(aiServicePath)) {
      const content = fs.readFileSync(aiServicePath, 'utf8');
      
      if (content.includes('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')) {
        console.log('⚠️  Using default HuggingFace token - please update for production');
      } else {
        console.log('✅ HuggingFace token configured');
      }
      
      if (content.includes('AIzaSyBKd-VhiOaBqvgCEopUi3vvWqKRRjMliDY')) {
        console.log('⚠️  Using default Gemini API key - please update for production');
      } else {
        console.log('✅ Gemini API key configured');
      }
      
      console.log('✅ AI processing service found');
    } else {
      console.log('❌ AI processing service not found');
      process.exit(1);
    }
    
  } catch (error) {
    console.log('❌ Configuration check failed:', error.message);
    process.exit(1);
  }
  
  console.log('\n🎉 Setup validation complete!');
  console.log('\n📋 Summary:');
  console.log('   - Python 3 and required packages are installed');
  console.log('   - Temporary directory is ready');
  console.log('   - AI processing service is configured');
  console.log('\n🚀 You can now upload medical images for AI processing');
  console.log('\n⚠️  Remember to:');
  console.log('   - Update API keys for production use');
  console.log('   - Test with actual medical images');
  console.log('   - Monitor processing performance');
}
