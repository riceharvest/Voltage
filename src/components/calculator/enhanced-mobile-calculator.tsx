/**
 * Enhanced Mobile Calculator Component
 * 
 * Mobile-optimized calculator interface with haptic feedback,
 * voice input, camera integration, and one-handed operation.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Mic, 
  Camera, 
  Vibration, 
  Volume2, 
  VolumeX,
  Headphones,
  Hand,
  Zap,
  DollarSign,
  Calculator as CalcIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Share,
  Save,
  Download
} from 'lucide-react';
import { EnhancedCalculatorService } from '@/lib/enhanced-calculator-service';
import { CalculatorInput } from '@/lib/enhanced-calculator-service';

/**
 * Mobile Calculator Props
 */
interface MobileCalculatorProps {
  onCalculationComplete: (result: any) => void;
  initialInput?: Partial<CalculatorInput>;
  className?: string;
}

/**
 * Voice Input State
 */
interface VoiceInputState {
  listening: boolean;
  transcript: string;
  confidence: number;
  supported: boolean;
}

/**
 * Haptic Feedback Types
 */
type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'notification';

/**
 * Main Mobile Calculator Component
 */
export const EnhancedMobileCalculator: React.FC<MobileCalculatorProps> = ({
  onCalculationComplete,
  initialInput = {},
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [input, setInput] = useState<CalculatorInput>({
    category: 'classic',
    mode: 'diy',
    targetFlavor: '',
    targetVolume: 250,
    servingSize: 250,
    batchSize: 1,
    region: 'EU',
    currency: 'EUR',
    language: 'en',
    qualityPreference: 'standard',
    timePreference: 'monthly',
    culturalPreference: 'european',
    age: 25,
    healthConditions: [],
    caffeineSensitivity: 'medium',
    useAmazonIntegration: true,
    enableBatchOptimization: true,
    enableCostAnalysis: true,
    enableRegionalAdaptation: true,
    ...initialInput
  });
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [voiceInput, setVoiceInput] = useState<VoiceInputState>({
    listening: false,
    transcript: '',
    confidence: 0,
    supported: false
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [cameraMode, setCameraMode] = useState(false);
  
  const calculatorService = useRef(new EnhancedCalculatorService());
  const recognitionRef = useRef<any>(null);

  // Initialize voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = input.language === 'nl' ? 'nl-NL' : 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        setVoiceInput(prev => ({
          ...prev,
          transcript,
          confidence: confidence * 100,
          listening: false
        }));
        processVoiceInput(transcript);
      };
      
      recognitionRef.current.onerror = () => {
        setVoiceInput(prev => ({ ...prev, listening: false }));
      };
      
      setVoiceInput(prev => ({ ...prev, supported: true }));
    }
  }, [input.language]);

  // Provide haptic feedback
  const provideHapticFeedback = (type: HapticType) => {
    if (!hapticsEnabled) return;
    
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        selection: [5],
        notification: [50, 50, 50]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // Start voice input
  const startVoiceInput = () => {
    if (!voiceInput.supported) return;
    
    setVoiceInput(prev => ({ ...prev, listening: true, transcript: '' }));
    recognitionRef.current?.start();
    provideHapticFeedback('light');
  };

  // Process voice input
  const processVoiceInput = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Map voice commands to actions
    if (lowerTranscript.includes('classic') || lowerTranscript.includes('soda')) {
      setInput(prev => ({ ...prev, category: 'classic' }));
      provideHapticFeedback('selection');
    } else if (lowerTranscript.includes('energy')) {
      setInput(prev => ({ ...prev, category: 'energy' }));
      provideHapticFeedback('selection');
    } else if (lowerTranscript.includes('hybrid')) {
      setInput(prev => ({ ...prev, category: 'hybrid' }));
      provideHapticFeedback('selection');
    } else if (lowerTranscript.includes('diy') || lowerTranscript.includes('make')) {
      setInput(prev => ({ ...prev, mode: 'diy' }));
      provideHapticFeedback('selection');
    } else if (lowerTranscript.includes('premade') || lowerTranscript.includes('buy')) {
      setInput(prev => ({ ...prev, mode: 'premade' }));
      provideHapticFeedback('selection');
    }
    
    // Volume commands
    const volumeMatch = lowerTranscript.match(/(\d+)\s*(ml|milliliters?|liters?|l)/);
    if (volumeMatch) {
      const volume = parseInt(volumeMatch[1]);
      const unit = volumeMatch[2];
      const finalVolume = unit.includes('liter') || unit === 'l' ? volume * 1000 : volume;
      setInput(prev => ({ ...prev, targetVolume: finalVolume }));
      provideHapticFeedback('medium');
    }
  };

  // Perform calculation
  const performCalculation = async () => {
    setLoading(true);
    provideHapticFeedback('medium');
    
    try {
      const calculationResult = await calculatorService.current.performEnhancedCalculation(input);
      setResult(calculationResult);
      onCalculationComplete(calculationResult);
      provideHapticFeedback('heavy');
    } catch (error) {
      console.error('Calculation failed:', error);
      provideHapticFeedback('notification');
    } finally {
      setLoading(false);
    }
  };

  // Navigation steps
  const steps = [
    { id: 'category', title: 'Category', icon: Zap },
    { id: 'mode', title: 'Mode', icon: Settings },
    { id: 'flavor', title: 'Flavor', icon: Hand },
    { id: 'volume', title: 'Volume', icon: Calculator },
    { id: 'region', title: 'Region', icon: Smartphone },
    { id: 'advanced', title: 'Advanced', icon: Settings }
  ];

  const currentStepData = steps[currentStep];

  // Next/Previous navigation
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      provideHapticFeedback('light');
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      provideHapticFeedback('light');
    }
  };

  return (
    <div className={`max-w-sm mx-auto bg-white dark:bg-gray-900 min-h-screen ${className}`}>
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Smart Calculator</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
            >
              <Vibration className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Voice Input Bar */}
      {voiceInput.supported && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className={`w-4 h-4 ${voiceInput.listening ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {voiceInput.listening ? 'Listening...' : 'Voice input available'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={startVoiceInput}
              disabled={voiceInput.listening}
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          {voiceInput.transcript && (
            <div className="mt-1 text-xs text-gray-500 italic">
              "{voiceInput.transcript}" (confidence: {Math.round(voiceInput.confidence)}%)
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 flex-1">
        {/* Category Selection */}
        {currentStep === 0 && (
          <CategoryStep 
            input={input} 
            onChange={setInput}
            onNext={goToNextStep}
            provideHapticFeedback={provideHapticFeedback}
          />
        )}

        {/* Mode Selection */}
        {currentStep === 1 && (
          <ModeStep 
            input={input} 
            onChange={setInput}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            provideHapticFeedback={provideHapticFeedback}
          />
        )}

        {/* Flavor Selection */}
        {currentStep === 2 && (
          <FlavorStep 
            input={input} 
            onChange={setInput}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            provideHapticFeedback={provideHapticFeedback}
            cameraMode={cameraMode}
            setCameraMode={setCameraMode}
          />
        )}

        {/* Volume Settings */}
        {currentStep === 3 && (
          <VolumeStep 
            input={input} 
            onChange={setInput}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            provideHapticFeedback={provideHapticFeedback}
          />
        )}

        {/* Regional Settings */}
        {currentStep === 4 && (
          <RegionStep 
            input={input} 
            onChange={setInput}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            provideHapticFeedback={provideHapticFeedback}
          />
        )}

        {/* Advanced Options */}
        {currentStep === 5 && (
          <AdvancedStep 
            input={input} 
            onChange={setInput}
            onCalculate={performCalculation}
            onPrevious={goToPreviousStep}
            loading={loading}
            provideHapticFeedback={provideHapticFeedback}
          />
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
          <ResultPreview 
            result={result}
            onComplete={onCalculationComplete}
            provideHapticFeedback={provideHapticFeedback}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Category Selection Step
 */
const CategoryStep: React.FC<{
  input: CalculatorInput;
  onChange: (input: CalculatorInput) => void;
  onNext: () => void;
  provideHapticFeedback: (type: HapticType) => void;
}> = ({ input, onChange, onNext, provideHapticFeedback }) => {
  const categories = [
    { id: 'classic', name: 'Classic', desc: 'Traditional sodas', icon: '🥤', color: 'bg-blue-500' },
    { id: 'energy', name: 'Energy', desc: 'High performance', icon: '⚡', color: 'bg-orange-500' },
    { id: 'hybrid', name: 'Hybrid', desc: 'Creative fusion', icon: '✨', color: 'bg-purple-500' }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Choose Category</h2>
        <p className="text-gray-600 dark:text-gray-400">Select your beverage type</p>
      </div>
      
      <div className="space-y-3">
        {categories.map((category) => (
          <Card 
            key={category.id}
            className={`cursor-pointer transition-all ${
              input.category === category.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onClick={() => {
              onChange({ ...input, category: category.id as any });
              provideHapticFeedback('selection');
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${category.color} flex items-center justify-center text-white text-lg`}>
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{category.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Button 
        className="w-full" 
        onClick={onNext}
        disabled={!input.category}
      >
        Continue
      </Button>
    </div>
  );
};

/**
 * Mode Selection Step
 */
const ModeStep: React.FC<{
  input: CalculatorInput;
  onChange: (input: CalculatorInput) => void;
  onNext: () => void;
  onPrevious: () => void;
  provideHapticFeedback: (type: HapticType) => void;
}> = ({ input, onChange, onNext, onPrevious, provideHapticFeedback }) => {
  const modes = [
    { id: 'diy', name: 'DIY', desc: 'From scratch', icon: '🔧', color: 'bg-green-500' },
    { id: 'premade', name: 'Premade', desc: 'Commercial', icon: '📦', color: 'bg-blue-500' },
    { id: 'hybrid', name: 'Hybrid', desc: 'Blended', icon: '⚡', color: 'bg-purple-500' }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Choose Mode</h2>
        <p className="text-gray-600 dark:text-gray-400">How would you like to prepare?</p>
      </div>
      
      <div className="space-y-3">
        {modes.map((mode) => (
          <Card 
            key={mode.id}
            className={`cursor-pointer transition-all ${
              input.mode === mode.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onClick={() => {
              onChange({ ...input, mode: mode.id as any });
              provideHapticFeedback('selection');
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${mode.color} flex items-center justify-center text-white text-lg`}>
                  {mode.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{mode.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{mode.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex space-x-3">
        <Button variant="outline" className="flex-1" onClick={onPrevious}>
          Back
        </Button>
        <Button className="flex-1" onClick={onNext} disabled={!input.mode}>
          Continue
        </Button>
      </div>
    </div>
  );
};

/**
 * Flavor Selection Step
 */
const FlavorStep: React.FC<{
  input: CalculatorInput;
  onChange: (input: CalculatorInput) => void;
  onNext: () => void;
  onPrevious: () => void;
  provideHapticFeedback: (type: HapticType) => void;
  cameraMode: boolean;
  setCameraMode: (mode: boolean) => void;
}> = ({ input, onChange, onNext, onPrevious, provideHapticFeedback, cameraMode, setCameraMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlavor, setSelectedFlavor] = useState('');
  
  // Mock flavor data - in real app, this would come from API
  const flavors = [
    { id: 'berry-citrus-fusion', name: 'Berry Citrus Fusion', category: 'fruit' },
    { id: 'cola-kick', name: 'Cola Kick', category: 'cola' },
    { id: 'tropical-bliss', name: 'Tropical Bliss', category: 'tropical' },
    { id: 'cherry-blast', name: 'Cherry Blast', category: 'fruit' }
  ];

  const filteredFlavors = flavors.filter(flavor =>
    flavor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Choose Flavor</h2>
        <p className="text-gray-600 dark:text-gray-400">What taste are you craving?</p>
      </div>
      
      {/* Search and Camera */}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search flavors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        <Button
          variant={cameraMode ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setCameraMode(!cameraMode);
            provideHapticFeedback('selection');
          }}
        >
          <Camera className="w-4 h-4" />
        </Button>
      </div>

      {cameraMode && (
        <Card className="bg-gray-50 dark:bg-gray-800">
          <CardContent className="p-4 text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Camera scanning not yet implemented
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Flavor Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredFlavors.map((flavor) => (
          <Card 
            key={flavor.id}
            className={`cursor-pointer transition-all ${
              selectedFlavor === flavor.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onClick={() => {
              setSelectedFlavor(flavor.id);
              onChange({ ...input, targetFlavor: flavor.id });
              provideHapticFeedback('selection');
            }}
          >
            <CardContent className="p-3 text-center">
              <div className="text-2xl mb-2">
                {flavor.category === 'fruit' ? '🍓' : 
                 flavor.category === 'cola' ? '🥤' : 
                 flavor.category === 'tropical' ? '🥭' : '🍒'}
              </div>
              <h3 className="font-medium text-sm text-gray-900 dark:text-white">{flavor.name}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex space-x-3">
        <Button variant="outline" className="flex-1" onClick={onPrevious}>
          Back
        </Button>
        <Button 
          className="flex-1" 
          onClick={onNext} 
          disabled={!selectedFlavor}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

/**
 * Volume Settings Step
 */
const VolumeStep: React.FC<{
  input: CalculatorInput;
  onChange: (input: CalculatorInput) => void;
  onNext: () => void;
  onPrevious: () => void;
  provideHapticFeedback: (type: HapticType) => void;
}> = ({ input, onChange, onNext, onPrevious, provideHapticFeedback }) => {
  const [volume, setVolume] = useState(input.targetVolume);
  const [servingSize, setServingSize] = useState(input.servingSize);

  useEffect(() => {
    onChange({ 
      ...input, 
      targetVolume: volume, 
      servingSize: servingSize,
      batchSize: Math.floor(volume / servingSize)
    });
  }, [volume, servingSize]);

  const volumePresets = [
    { label: 'Small', value: 250, icon: '🥤' },
    { label: 'Medium', value: 500, icon: '🍺' },
    { label: 'Large', value: 750, icon: '🍼' },
    { label: 'XL', value: 1000, icon: '🥛' }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Volume Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Set your batch size</p>
      </div>
      
      {/* Volume Presets */}
      <div className="grid grid-cols-2 gap-2">
        {volumePresets.map((preset) => (
          <Button
            key={preset.label}
            variant={volume === preset.value ? "default" : "outline"}
            className="h-16 flex flex-col"
            onClick={() => {
              setVolume(preset.value);
              provideHapticFeedback('selection');
            }}
          >
            <span className="text-lg">{preset.icon}</span>
            <span className="text-xs">{preset.label}</span>
            <span className="text-xs">{preset.value}ml</span>
          </Button>
        ))}
      </div>
      
      {/* Custom Volume */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total Volume: {volume}ml
            </label>
            <Slider
              value={[volume]}
              onValueChange={(value) => {
                setVolume(value[0]);
                provideHapticFeedback('light');
              }}
              min={100}
              max={2000}
              step={50}
              className="mt-2"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Serving Size: {servingSize}ml
            </label>
            <Slider
              value={[servingSize]}
              onValueChange={(value) => {
                setServingSize(value[0]);
                provideHapticFeedback('light');
              }}
              min={100}
              max={500}
              step={50}
              className="mt-2"
            />
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Servings per batch: {Math.floor(volume / servingSize)}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex space-x-3">
        <Button variant="outline" className="flex-1" onClick={onPrevious}>
          Back
        </Button>
        <Button className="flex-1" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
};

/**
 * Region Selection Step
 */
const RegionStep: React.FC<{
  input: CalculatorInput;
  onChange: (input: CalculatorInput) => void;
  onNext: () => void;
  onPrevious: () => void;
  provideHapticFeedback: (type: HapticType) => void;
}> = ({ input, onChange, onNext, onPrevious, provideHapticFeedback }) => {
  const regions = [
    { id: 'EU', name: 'Europe', flag: '🇪🇺', currency: 'EUR' },
    { id: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD' },
    { id: 'UK', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
    { id: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
    { id: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR' }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Region</h2>
        <p className="text-gray-600 dark:text-gray-400">For pricing and regulations</p>
      </div>
      
      <div className="space-y-2">
        {regions.map((region) => (
          <Card 
            key={region.id}
            className={`cursor-pointer transition-all ${
              input.region === region.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onClick={() => {
              onChange({ ...input, region: region.id, currency: region.currency });
              provideHapticFeedback('selection');
            }}
          >
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{region.flag}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{region.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Currency: {region.currency}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex space-x-3">
        <Button variant="outline" className="flex-1" onClick={onPrevious}>
          Back
        </Button>
        <Button className="flex-1" onClick={onNext} disabled={!input.region}>
          Continue
        </Button>
      </div>
    </div>
  );
};

/**
 * Advanced Options Step
 */
const AdvancedStep: React.FC<{
  input: CalculatorInput;
  onChange: (input: CalculatorInput) => void;
  onCalculate: () => void;
  onPrevious: () => void;
  loading: boolean;
  provideHapticFeedback: (type: HapticType) => void;
}> = ({ input, onChange, onCalculate, onPrevious, loading, provideHapticFeedback }) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Advanced Options</h2>
        <p className="text-gray-600 dark:text-gray-400">Fine-tune your calculation</p>
      </div>
      
      <div className="space-y-4">
        {/* Quality Preference */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quality Preference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {(['budget', 'standard', 'premium'] as const).map((pref) => (
                <Button
                  key={pref}
                  variant={input.qualityPreference === pref ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onChange({ ...input, qualityPreference: pref });
                    provideHapticFeedback('selection');
                  }}
                >
                  {pref.charAt(0).toUpperCase() + pref.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'useAmazonIntegration', label: 'Amazon Pricing' },
              { key: 'enableBatchOptimization', label: 'Batch Optimization' },
              { key: 'enableCostAnalysis', label: 'Cost Analysis' },
              { key: 'enableRegionalAdaptation', label: 'Regional Adaptation' }
            ].map((feature) => (
              <div key={feature.key} className="flex items-center justify-between">
                <span className="text-sm">{feature.label}</span>
                <Button
                  variant={input[feature.key as keyof CalculatorInput] ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onChange({ 
                      ...input, 
                      [feature.key]: !input[feature.key as keyof CalculatorInput] 
                    });
                    provideHapticFeedback('selection');
                  }}
                >
                  {input[feature.key as keyof CalculatorInput] ? 'On' : 'Off'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex space-x-3">
        <Button variant="outline" className="flex-1" onClick={onPrevious}>
          Back
        </Button>
        <Button 
          className="flex-1" 
          onClick={onCalculate}
          disabled={loading}
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </Button>
      </div>
    </div>
  );
};

/**
 * Result Preview Component
 */
const ResultPreview: React.FC<{
  result: any;
  onComplete: (result: any) => void;
  provideHapticFeedback: (type: HapticType) => void;
}> = ({ result, onComplete, provideHapticFeedback }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-green-800 dark:text-green-400">Calculation Complete!</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setExpanded(!expanded);
              provideHapticFeedback('light');
            }}
          >
            {expanded ? <ChevronRight className="w-4 h-4 rotate-90" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-green-800 dark:text-green-400">{result.basic.caffeine}mg</div>
            <div className="text-green-600 dark:text-green-500">Caffeine</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-800 dark:text-green-400">{result.basic.valid ? '✓' : '⚠'}</div>
            <div className="text-green-600 dark:text-green-500">Valid</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-800 dark:text-green-400">{result.recommendations.approach}</div>
            <div className="text-green-600 dark:text-green-500">Recommended</div>
          </div>
        </div>
        
        {expanded && (
          <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" className="flex-1">
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedMobileCalculator;