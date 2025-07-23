import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Thermometer, Activity, Save, X } from 'lucide-react';

const vitalSignsSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  temperature: z.object({
    value: z.number().min(35).max(45),
    unit: z.enum(['celsius', 'fahrenheit'])
  }),
  bloodPressure: z.object({
    systolic: z.number().min(70).max(250),
    diastolic: z.number().min(40).max(150)
  }),
  heartRate: z.object({
    value: z.number().min(30).max(200)
  }),
  respiratoryRate: z.object({
    value: z.number().min(8).max(40)
  }),
  oxygenSaturation: z.object({
    value: z.number().min(70).max(100)
  }),
  height: z.object({
    value: z.number().min(30).max(300).optional(),
    unit: z.enum(['cm', 'ft'])
  }).optional(),
  weight: z.object({
    value: z.number().min(1).max(500).optional(),
    unit: z.enum(['kg', 'lbs'])
  }).optional(),
  painScale: z.number().min(0).max(10).optional(),
  notes: z.string().optional()
});

type VitalSignsFormData = z.infer<typeof vitalSignsSchema>;

interface VitalSignsFormProps {
  patientId: string;
  onSubmit: (data: VitalSignsFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<VitalSignsFormData>;
}

const VitalSignsForm: React.FC<VitalSignsFormProps> = ({
  patientId,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<VitalSignsFormData>({
    resolver: zodResolver(vitalSignsSchema),
    defaultValues: {
      patientId,
      temperature: { unit: 'celsius', value: 37 },
      bloodPressure: { systolic: 120, diastolic: 80 },
      heartRate: { value: 72 },
      respiratoryRate: { value: 16 },
      oxygenSaturation: { value: 98 },
      height: { unit: 'cm' },
      weight: { unit: 'kg' },
      ...initialData
    }
  });

  const temperatureUnit = watch('temperature.unit');
  const heightUnit = watch('height.unit');
  const weightUnit = watch('weight.unit');

  const handleFormSubmit = (data: VitalSignsFormData) => {
    onSubmit(data);
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { status: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { status: 'Overweight', color: 'text-yellow-600' };
    return { status: 'Obese', color: 'text-red-600' };
  };

  const calculateBMI = () => {
    const height = watch('height.value');
    const weight = watch('weight.value');
    
    if (!height || !weight) return null;
    
    let heightInMeters = height;
    let weightInKg = weight;
    
    if (heightUnit === 'ft') {
      heightInMeters = height * 0.3048;
    } else {
      heightInMeters = height / 100;
    }
    
    if (weightUnit === 'lbs') {
      weightInKg = weight * 0.453592;
    }
    
    const bmi = weightInKg / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10;
  };

  const bmi = calculateBMI();
  const bmiStatus = bmi ? getBMIStatus(bmi) : null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Heart className="w-6 h-6 mr-2 text-red-500" />
          Vital Signs Recording
        </CardTitle>
        <CardDescription>Record patient vital signs and measurements</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Primary Vital Signs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center mb-3">
                <Thermometer className="w-5 h-5 mr-2 text-red-600" />
                <Label className="font-medium">Temperature</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  {...register('temperature.value', { valueAsNumber: true })}
                  className="flex-1"
                />
                <Select
                  value={temperatureUnit}
                  onValueChange={(value) => setValue('temperature.unit', value as 'celsius' | 'fahrenheit')}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celsius">°C</SelectItem>
                    <SelectItem value="fahrenheit">°F</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.temperature?.value && (
                <p className="text-red-500 text-sm mt-1">{errors.temperature.value.message}</p>
              )}
            </Card>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center mb-3">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                <Label className="font-medium">Blood Pressure</Label>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="120"
                  {...register('bloodPressure.systolic', { valueAsNumber: true })}
                  className="flex-1"
                />
                <span className="text-gray-500">/</span>
                <Input
                  type="number"
                  placeholder="80"
                  {...register('bloodPressure.diastolic', { valueAsNumber: true })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">mmHg</span>
              </div>
              {(errors.bloodPressure?.systolic || errors.bloodPressure?.diastolic) && (
                <p className="text-red-500 text-sm mt-1">Invalid blood pressure values</p>
              )}
            </Card>

            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center mb-3">
                <Heart className="w-5 h-5 mr-2 text-green-600" />
                <Label className="font-medium">Heart Rate</Label>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="72"
                  {...register('heartRate.value', { valueAsNumber: true })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">bpm</span>
              </div>
              {errors.heartRate?.value && (
                <p className="text-red-500 text-sm mt-1">{errors.heartRate.value.message}</p>
              )}
            </Card>

            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center mb-3">
                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                <Label className="font-medium">Respiratory Rate</Label>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="16"
                  {...register('respiratoryRate.value', { valueAsNumber: true })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">breaths/min</span>
              </div>
              {errors.respiratoryRate?.value && (
                <p className="text-red-500 text-sm mt-1">{errors.respiratoryRate.value.message}</p>
              )}
            </Card>
          </div>

          {/* Oxygen Saturation */}
          <Card className="p-4 bg-cyan-50 border-cyan-200">
            <div className="flex items-center mb-3">
              <Activity className="w-5 h-5 mr-2 text-cyan-600" />
              <Label className="font-medium">Oxygen Saturation</Label>
            </div>
            <div className="flex gap-2 items-center max-w-xs">
              <Input
                type="number"
                placeholder="98"
                {...register('oxygenSaturation.value', { valueAsNumber: true })}
                className="flex-1"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            {errors.oxygenSaturation?.value && (
              <p className="text-red-500 text-sm mt-1">{errors.oxygenSaturation.value.message}</p>
            )}
          </Card>

          {/* Physical Measurements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center mb-3">
                <Activity className="w-5 h-5 mr-2 text-yellow-600" />
                <Label className="font-medium">Height</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="170"
                  {...register('height.value', { valueAsNumber: true })}
                  className="flex-1"
                />
                <Select
                  value={heightUnit}
                  onValueChange={(value) => setValue('height.unit', value as 'cm' | 'ft')}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="ft">ft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.height?.value && (
                <p className="text-red-500 text-sm mt-1">{errors.height.value.message}</p>
              )}
            </Card>

            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center mb-3">
                <Activity className="w-5 h-5 mr-2 text-orange-600" />
                <Label className="font-medium">Weight</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="70"
                  {...register('weight.value', { valueAsNumber: true })}
                  className="flex-1"
                />
                <Select
                  value={weightUnit}
                  onValueChange={(value) => setValue('weight.unit', value as 'kg' | 'lbs')}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.weight?.value && (
                <p className="text-red-500 text-sm mt-1">{errors.weight.value.message}</p>
              )}
            </Card>
          </div>

          {/* BMI Display */}
          {bmi && (
            <Card className="p-4 bg-gray-50 border-gray-200">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Body Mass Index (BMI)</Label>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">{bmi}</span>
                  <span className={`block text-sm ${bmiStatus?.color}`}>{bmiStatus?.status}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Pain Scale */}
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center mb-3">
              <Activity className="w-5 h-5 mr-2 text-red-600" />
              <Label className="font-medium">Pain Scale (0-10)</Label>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min="0"
                max="10"
                placeholder="0"
                {...register('painScale', { valueAsNumber: true })}
                className="max-w-xs"
              />
              <span className="text-sm text-gray-500">0 = No pain, 10 = Severe pain</span>
            </div>
            {errors.painScale && (
              <p className="text-red-500 text-sm mt-1">{errors.painScale.message}</p>
            )}
          </Card>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional observations or notes..."
              {...register('notes')}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-red-600 hover:bg-red-700">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Recording...' : 'Record Vital Signs'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default VitalSignsForm; 