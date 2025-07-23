import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Save, FileText, Heart, Pill, AlertTriangle } from 'lucide-react';

const medicalRecordSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  recordType: z.enum(['consultation', 'emergency', 'surgery', 'follow-up', 'preventive']),
  chiefComplaint: z.string().min(1, 'Chief complaint is required'),
  historyOfPresentIllness: z.string().min(1, 'History of present illness is required'),
  pastMedicalHistory: z.array(z.string()).optional(),
  familyHistory: z.array(z.string()).optional(),
  socialHistory: z.object({
    smoking: z.enum(['never', 'former', 'current']).optional(),
    alcohol: z.enum(['never', 'occasional', 'regular', 'heavy']).optional(),
    drugs: z.enum(['never', 'former', 'current']).optional(),
    occupation: z.string().optional(),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional()
  }).optional(),
  allergies: z.array(z.object({
    allergen: z.string(),
    reaction: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe'])
  })).optional(),
  currentMedications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    startDate: z.string(),
    endDate: z.string().optional()
  })).optional(),
  physicalExamination: z.object({
    generalAppearance: z.string().optional(),
    systemReview: z.object({
      cardiovascular: z.string().optional(),
      respiratory: z.string().optional(),
      gastrointestinal: z.string().optional(),
      neurological: z.string().optional(),
      musculoskeletal: z.string().optional(),
      dermatological: z.string().optional()
    }).optional()
  }).optional(),
  assessment: z.string().min(1, 'Assessment is required'),
  plan: z.string().min(1, 'Plan is required'),
  followUpInstructions: z.string().optional()
});

type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;

interface MedicalRecordFormProps {
  patientId: string;
  onSubmit: (data: MedicalRecordFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({
  patientId,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [allergies, setAllergies] = useState<Array<{ allergen: string; reaction: string; severity: 'mild' | 'moderate' | 'severe' }>>([]);
  const [medications, setMedications] = useState<Array<{ name: string; dosage: string; frequency: string; startDate: string; endDate?: string }>>([]);
  const [pastMedicalHistory, setPastMedicalHistory] = useState<string[]>([]);
  const [familyHistory, setFamilyHistory] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      patientId,
      allergies: [],
      currentMedications: [],
      pastMedicalHistory: [],
      familyHistory: []
    }
  });

  const recordType = watch('recordType');

  const handleFormSubmit = (data: MedicalRecordFormData) => {
    const formData = {
      ...data,
      allergies,
      currentMedications: medications,
      pastMedicalHistory,
      familyHistory
    };
    onSubmit(formData);
  };

  const addAllergy = () => {
    setAllergies([...allergies, { allergen: '', reaction: '', severity: 'mild' }]);
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', startDate: '' }]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const addPastMedicalHistory = () => {
    setPastMedicalHistory([...pastMedicalHistory, '']);
  };

  const addFamilyHistory = () => {
    setFamilyHistory([...familyHistory, '']);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-6 h-6 mr-2 text-blue-600" />
          Medical Record Entry
        </CardTitle>
        <CardDescription>Complete patient medical record documentation</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recordType">Record Type</Label>
              <Select onValueChange={(value) => setValue('recordType', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select record type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="preventive">Preventive</SelectItem>
                </SelectContent>
              </Select>
              {errors.recordType && <p className="text-red-500 text-sm mt-1">{errors.recordType.message}</p>}
            </div>
          </div>

          <Tabs defaultValue="chief-complaint" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="chief-complaint">Chief Complaint</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="examination">Examination</TabsTrigger>
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
            </TabsList>

            <TabsContent value="chief-complaint" className="space-y-4">
              <div>
                <Label htmlFor="chiefComplaint">Chief Complaint</Label>
                <Textarea
                  id="chiefComplaint"
                  placeholder="Primary reason for visit..."
                  {...register('chiefComplaint')}
                  className="min-h-[100px]"
                />
                {errors.chiefComplaint && <p className="text-red-500 text-sm mt-1">{errors.chiefComplaint.message}</p>}
              </div>

              <div>
                <Label htmlFor="historyOfPresentIllness">History of Present Illness</Label>
                <Textarea
                  id="historyOfPresentIllness"
                  placeholder="Detailed history of current condition..."
                  {...register('historyOfPresentIllness')}
                  className="min-h-[120px]"
                />
                {errors.historyOfPresentIllness && <p className="text-red-500 text-sm mt-1">{errors.historyOfPresentIllness.message}</p>}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Past Medical History</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPastMedicalHistory}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                {pastMedicalHistory.map((history, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="Medical condition or procedure"
                      value={history}
                      onChange={(e) => {
                        const newHistory = [...pastMedicalHistory];
                        newHistory[index] = e.target.value;
                        setPastMedicalHistory(newHistory);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPastMedicalHistory(pastMedicalHistory.filter((_, i) => i !== index))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Family History</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFamilyHistory}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                {familyHistory.map((history, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      placeholder="Family medical history"
                      value={history}
                      onChange={(e) => {
                        const newHistory = [...familyHistory];
                        newHistory[index] = e.target.value;
                        setFamilyHistory(newHistory);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFamilyHistory(familyHistory.filter((_, i) => i !== index))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="socialHistory.smoking">Smoking History</Label>
                  <Select onValueChange={(value) => setValue('socialHistory.smoking', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select smoking status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="former">Former</SelectItem>
                      <SelectItem value="current">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="socialHistory.alcohol">Alcohol Use</Label>
                  <Select onValueChange={(value) => setValue('socialHistory.alcohol', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select alcohol use" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never</SelectItem>
                      <SelectItem value="occasional">Occasional</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="medications" className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                    Allergies
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAllergy}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Allergy
                  </Button>
                </div>
                {allergies.map((allergy, index) => (
                  <Card key={index} className="p-4 mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <Input
                        placeholder="Allergen"
                        value={allergy.allergen}
                        onChange={(e) => {
                          const newAllergies = [...allergies];
                          newAllergies[index].allergen = e.target.value;
                          setAllergies(newAllergies);
                        }}
                      />
                      <Input
                        placeholder="Reaction"
                        value={allergy.reaction}
                        onChange={(e) => {
                          const newAllergies = [...allergies];
                          newAllergies[index].reaction = e.target.value;
                          setAllergies(newAllergies);
                        }}
                      />
                      <Select
                        value={allergy.severity}
                        onValueChange={(value) => {
                          const newAllergies = [...allergies];
                          newAllergies[index].severity = value as 'mild' | 'moderate' | 'severe';
                          setAllergies(newAllergies);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mild">Mild</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="severe">Severe</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAllergy(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="flex items-center">
                    <Pill className="w-4 h-4 mr-2 text-blue-500" />
                    Current Medications
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Medication
                  </Button>
                </div>
                {medications.map((medication, index) => (
                  <Card key={index} className="p-4 mb-2">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                      <Input
                        placeholder="Medication name"
                        value={medication.name}
                        onChange={(e) => {
                          const newMedications = [...medications];
                          newMedications[index].name = e.target.value;
                          setMedications(newMedications);
                        }}
                      />
                      <Input
                        placeholder="Dosage"
                        value={medication.dosage}
                        onChange={(e) => {
                          const newMedications = [...medications];
                          newMedications[index].dosage = e.target.value;
                          setMedications(newMedications);
                        }}
                      />
                      <Input
                        placeholder="Frequency"
                        value={medication.frequency}
                        onChange={(e) => {
                          const newMedications = [...medications];
                          newMedications[index].frequency = e.target.value;
                          setMedications(newMedications);
                        }}
                      />
                      <Input
                        type="date"
                        value={medication.startDate}
                        onChange={(e) => {
                          const newMedications = [...medications];
                          newMedications[index].startDate = e.target.value;
                          setMedications(newMedications);
                        }}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMedication(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="examination" className="space-y-4">
              <div>
                <Label htmlFor="physicalExamination.generalAppearance">General Appearance</Label>
                <Textarea
                  id="physicalExamination.generalAppearance"
                  placeholder="General appearance and demeanor..."
                  {...register('physicalExamination.generalAppearance')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="physicalExamination.systemReview.cardiovascular">Cardiovascular</Label>
                  <Textarea
                    id="physicalExamination.systemReview.cardiovascular"
                    placeholder="Cardiovascular examination findings..."
                    {...register('physicalExamination.systemReview.cardiovascular')}
                  />
                </div>

                <div>
                  <Label htmlFor="physicalExamination.systemReview.respiratory">Respiratory</Label>
                  <Textarea
                    id="physicalExamination.systemReview.respiratory"
                    placeholder="Respiratory examination findings..."
                    {...register('physicalExamination.systemReview.respiratory')}
                  />
                </div>

                <div>
                  <Label htmlFor="physicalExamination.systemReview.gastrointestinal">Gastrointestinal</Label>
                  <Textarea
                    id="physicalExamination.systemReview.gastrointestinal"
                    placeholder="Gastrointestinal examination findings..."
                    {...register('physicalExamination.systemReview.gastrointestinal')}
                  />
                </div>

                <div>
                  <Label htmlFor="physicalExamination.systemReview.neurological">Neurological</Label>
                  <Textarea
                    id="physicalExamination.systemReview.neurological"
                    placeholder="Neurological examination findings..."
                    {...register('physicalExamination.systemReview.neurological')}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="assessment" className="space-y-4">
              <div>
                <Label htmlFor="assessment">Assessment</Label>
                <Textarea
                  id="assessment"
                  placeholder="Clinical assessment and diagnosis..."
                  {...register('assessment')}
                  className="min-h-[100px]"
                />
                {errors.assessment && <p className="text-red-500 text-sm mt-1">{errors.assessment.message}</p>}
              </div>

              <div>
                <Label htmlFor="plan">Treatment Plan</Label>
                <Textarea
                  id="plan"
                  placeholder="Treatment plan and recommendations..."
                  {...register('plan')}
                  className="min-h-[100px]"
                />
                {errors.plan && <p className="text-red-500 text-sm mt-1">{errors.plan.message}</p>}
              </div>

              <div>
                <Label htmlFor="followUpInstructions">Follow-up Instructions</Label>
                <Textarea
                  id="followUpInstructions"
                  placeholder="Follow-up instructions and next steps..."
                  {...register('followUpInstructions')}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Record'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default MedicalRecordForm; 