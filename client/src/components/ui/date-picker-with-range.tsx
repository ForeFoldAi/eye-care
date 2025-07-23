import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerWithRangeProps {
  value?: { from: Date; to: Date };
  onChange?: (range: { from: Date; to: Date } | undefined) => void;
  className?: string;
  placeholder?: string;
}

export const DatePickerWithRange: React.FC<DatePickerWithRangeProps> = ({
  value,
  onChange,
  className,
  placeholder = "Select date range"
}) => {
  const [fromDate, setFromDate] = React.useState<string>('');
  const [toDate, setToDate] = React.useState<string>('');

  React.useEffect(() => {
    if (value?.from) {
      setFromDate(value.from.toISOString().split('T')[0]);
    }
    if (value?.to) {
      setToDate(value.to.toISOString().split('T')[0]);
    }
  }, [value]);

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFromDate = e.target.value;
    setFromDate(newFromDate);
    
    if (newFromDate && toDate) {
      onChange?.({
        from: new Date(newFromDate),
        to: new Date(toDate)
      });
    }
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToDate = e.target.value;
    setToDate(newToDate);
    
    if (fromDate && newToDate) {
      onChange?.({
        from: new Date(fromDate),
        to: new Date(newToDate)
      });
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !fromDate && !toDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {fromDate && toDate ? (
              <>
                {new Date(fromDate).toLocaleDateString()} - {new Date(toDate).toLocaleDateString()}
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={handleToDateChange}
                className="w-full"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}; 