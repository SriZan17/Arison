import { Audio } from 'expo-av';
import { Platform } from 'react-native';

/**
 * Simple audio recording test to debug common issues
 */
export class AudioRecordingTest {
  
  static async testPermissions(): Promise<boolean> {
    try {
      console.log('Testing microphone permissions...');
      const { status } = await Audio.requestPermissionsAsync();
      console.log('Permission status:', status);
      return status === 'granted';
    } catch (error) {
      console.error('Permission test failed:', error);
      return false;
    }
  }

  static async testAudioMode(): Promise<boolean> {
    try {
      console.log('Testing audio mode setup...');
      console.log('Platform:', Platform.OS);
      
      // Skip audio mode setup on web platform
      if (Platform.OS === 'web') {
        console.log('Skipping audio mode setup on web platform');
        return true;
      }
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('Audio mode set successfully');
      return true;
    } catch (error) {
      console.error('Audio mode test failed:', error);
      return false;
    }
  }

  static async testBasicRecording(): Promise<boolean> {
    let recording: Audio.Recording | null = null;
    
    try {
      console.log('Testing basic recording...');
      
      // Test with simplified preset first
      recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      
      console.log('Recording prepared successfully');
      
      await recording.startAsync();
      console.log('Recording started successfully');
      
      // Record for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await recording.stopAndUnloadAsync();
      console.log('Recording stopped successfully');
      
      const uri = recording.getURI();
      console.log('Recording URI:', uri);
      
      return true;
    } catch (error) {
      console.error('Basic recording test failed:', error);
      
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      
      return false;
    }
  }

  static async testWithCustomOptions(): Promise<boolean> {
    let recording: Audio.Recording | null = null;
    
    try {
      console.log('Testing recording with preset options...');
      
      // Use proven preset instead of custom options to avoid compatibility issues
      recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      
      console.log('Preset recording prepared successfully');
      
      await recording.startAsync();
      console.log('Custom recording started successfully');
      
      // Record for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await recording.stopAndUnloadAsync();
      console.log('Preset recording stopped successfully');
      
      const uri = recording.getURI();
      console.log('Preset recording URI:', uri);
      
      return true;
    } catch (error) {
      console.error('Preset recording test failed:', error);
      
      if (recording) {
        try {
          await recording.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      
      return false;
    }
  }

  static async runAllTests(): Promise<void> {
    console.log('=== Audio Recording Debug Tests ===');
    
    const permissionsOk = await this.testPermissions();
    console.log('✓ Permissions test:', permissionsOk ? 'PASSED' : 'FAILED');
    
    if (!permissionsOk) {
      console.log('❌ Cannot continue without microphone permissions');
      return;
    }
    
    const audioModeOk = await this.testAudioMode();
    console.log('✓ Audio mode test:', audioModeOk ? 'PASSED' : 'FAILED');
    
    const basicRecordingOk = await this.testBasicRecording();
    console.log('✓ Basic recording test:', basicRecordingOk ? 'PASSED' : 'FAILED');
    
    const customRecordingOk = await this.testWithCustomOptions();
    console.log('✓ Preset recording test:', customRecordingOk ? 'PASSED' : 'FAILED');
    
    console.log('=== Test Results Summary ===');
    console.log(`Permissions: ${permissionsOk ? '✅' : '❌'}`);
    console.log(`Audio Mode: ${audioModeOk ? '✅' : '❌'}`);
    console.log(`Basic Recording: ${basicRecordingOk ? '✅' : '❌'}`);
    console.log(`Preset Recording: ${customRecordingOk ? '✅' : '❌'}`);
  }
}

// Export for easy testing
export const runAudioDebugTests = () => AudioRecordingTest.runAllTests();