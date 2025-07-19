
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonsProps {
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  disabled?: boolean;
}

export const ExportButtons = ({ onExportPDF, onExportExcel, disabled = false }: ExportButtonsProps) => {
  const handlePDFExport = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      toast.info('Fitur ekspor PDF sedang dalam pengembangan');
    }
  };

  const handleExcelExport = () => {
    if (onExportExcel) {
      onExportExcel();
    } else {
      toast.info('Fitur ekspor Excel sedang dalam pengembangan');
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handlePDFExport}
        disabled={disabled}
      >
        <Download className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleExcelExport}
        disabled={disabled}
      >
        <Download className="h-4 w-4 mr-2" />
        Export Excel
      </Button>
    </div>
  );
};
