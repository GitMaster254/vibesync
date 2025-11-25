import { useState } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { updateEqualizerBands, setEqualizerEnabled } from '@/lib/audio';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Settings, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Equalizer controls component with 10-band sliders and presets
 */
export function EqualizerControls() {
  const {
    equalizer: { enabled, bands, presets },
    setEqualizerEnabled,
    setEqualizerBand,
    setEqualizerPreset,
  } = usePlayerStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const frequencyLabels = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'];

  const handleBandChange = (bandIndex: number, value: number[]) => {
    const newValue = value[0];
    setEqualizerBand(bandIndex, newValue);
    updateEqualizerBands(bands.map((band, index) => index === bandIndex ? newValue : band));
  };

  const handlePresetChange = (preset: string) => {
    setEqualizerPreset(preset);
    const presetValues = presets[preset];
    if (presetValues) {
      updateEqualizerBands(presetValues);
    }
  };

  const handleReset = () => {
    const flatBands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    flatBands.forEach((_, index) => setEqualizerBand(index, 0));
    updateEqualizerBands(flatBands);
  };

  const handleToggleEnabled = () => {
    const newEnabled = !enabled;
    setEqualizerEnabled(newEnabled);
    setEqualizerEnabled(newEnabled);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Equalizer</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={enabled ? "default" : "secondary"}>
              {enabled ? "ON" : "OFF"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Enable Equalizer</span>
          <Button
            variant={enabled ? "default" : "outline"}
            size="sm"
            onClick={handleToggleEnabled}
          >
            {enabled ? "Enabled" : "Disabled"}
          </Button>
        </div>

        {/* Preset Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Preset</label>
          <Select onValueChange={handlePresetChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select preset" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(presets).map((preset) => (
                <SelectItem key={preset} value={preset}>
                  {preset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Band Controls */}
        {showAdvanced && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Frequency Bands</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 px-2"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {bands.map((band, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {frequencyLabels[index]}
                  </span>
                  <div className="h-24 flex items-end">
                    <Slider
                      orientation="vertical"
                      value={[band]}
                      onValueChange={(value) => handleBandChange(index, value)}
                      min={-20}
                      max={20}
                      step={0.5}
                      className="h-full"
                    />
                  </div>
                  <span className={cn(
                    "text-xs font-mono w-8 text-center",
                    band > 0 ? "text-green-500" : band < 0 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {band > 0 ? '+' : ''}{band}
                  </span>
                </div>
              ))}
            </div>

            {/* Gain Scale Reference */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-20dB</span>
              <span>0dB</span>
              <span>+20dB</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
