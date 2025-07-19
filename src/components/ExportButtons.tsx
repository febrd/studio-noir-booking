
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportData {
  title: string;
  headers: string[];
  data: (string | number)[][];
  filename: string;
}

interface ExportButtonsProps {
  onExportPDF?: () => void;
  onExportExcel?: () => void;
  disabled?: boolean;
  exportData?: ExportData;
}

export const ExportButtons = ({ 
  onExportPDF, 
  onExportExcel, 
  disabled = false,
  exportData 
}: ExportButtonsProps) => {
  
  const handlePDFExport = () => {
    if (onExportPDF) {
      onExportPDF();
    } else if (exportData) {
      try {
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text(exportData.title, 14, 22);
        
        // Add table
        autoTable(doc, {
          head: [exportData.headers],
          body: exportData.data,
          startY: 30,
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: [255, 255, 255],
          },
        });
        
        doc.save(`${exportData.filename}.pdf`);
        toast.success('File PDF berhasil diekspor');
      } catch (error) {
        console.error('Error exporting PDF:', error);
        toast.error('Gagal mengekspor PDF');
      }
    } else {
      toast.info('Fitur ekspor PDF sedang dalam pengembangan');
    }
  };

  const handleExcelExport = () => {
    if (onExportExcel) {
      onExportExcel();
    } else if (exportData) {
      try {
        const ws = XLSX.utils.aoa_to_sheet([exportData.headers, ...exportData.data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, `${exportData.filename}.xlsx`);
        toast.success('File Excel berhasil diekspor');
      } catch (error) {
        console.error('Error exporting Excel:', error);
        toast.error('Gagal mengekspor Excel');
      }
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
