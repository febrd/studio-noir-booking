
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleCaptchaProps {
  onValidation: (isValid: boolean) => void;
  reset?: boolean;
}

export const SimpleCaptcha = ({ onValidation, reset }: SimpleCaptchaProps) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operation, setOperation] = useState<'+' | '-' | '*'>('+');
  const [userAnswer, setUserAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [isValidated, setIsValidated] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const generateCaptcha = () => {
    const operations: ('+' | '-' | '*')[] = ['+', '-', '*'];
    const selectedOp = operations[Math.floor(Math.random() * operations.length)];
    
    let n1, n2, answer;
    
    switch (selectedOp) {
      case '+':
        n1 = Math.floor(Math.random() * 20) + 1;
        n2 = Math.floor(Math.random() * 20) + 1;
        answer = n1 + n2;
        break;
      case '-':
        n1 = Math.floor(Math.random() * 20) + 10;
        n2 = Math.floor(Math.random() * 10) + 1;
        answer = n1 - n2;
        break;
      case '*':
        n1 = Math.floor(Math.random() * 9) + 1;
        n2 = Math.floor(Math.random() * 9) + 1;
        answer = n1 * n2;
        break;
    }
    
    setNum1(n1);
    setNum2(n2);
    setOperation(selectedOp);
    setCorrectAnswer(answer);
    setUserAnswer('');
    setIsValidated(false);
    setShowValidation(false);
    onValidation(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (reset) {
      generateCaptcha();
    }
  }, [reset]);

  useEffect(() => {
    if (userAnswer) {
      const isValid = parseInt(userAnswer) === correctAnswer;
      setIsValidated(isValid);
      setShowValidation(true);
      onValidation(isValid);
    } else {
      setIsValidated(false);
      setShowValidation(false);
      onValidation(false);
    }
  }, [userAnswer, correctAnswer, onValidation]);

  const getOperationSymbol = () => {
    switch (operation) {
      case '+': return '＋';
      case '-': return '−';
      case '*': return '×';
      default: return operation;
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        Verifikasi (Selesaikan soal matematika)
      </Label>
      
      {/* Captcha Question */}
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-primary/20">
        <div className="flex items-center gap-2 text-lg font-mono font-semibold text-primary">
          <span className="bg-primary/10 px-2 py-1 rounded">{num1}</span>
          <span className="text-primary/70">{getOperationSymbol()}</span>
          <span className="bg-primary/10 px-2 py-1 rounded">{num2}</span>
          <span className="text-primary/70">=</span>
          <span className="text-primary/70">?</span>
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateCaptcha}
          className="p-2 h-8 w-8 ml-auto hover:bg-primary/10"
          title="Refresh soal"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* Answer Input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Masukkan jawaban"
            className="h-11 text-base pr-10"
          />
          
          {/* Validation Icon */}
          {showValidation && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValidated ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Message */}
      {showValidation && (
        <div className={`text-sm font-medium ${isValidated ? 'text-green-600' : 'text-red-600'}`}>
          {isValidated ? '✓ Jawaban benar!' : '✗ Jawaban salah, coba lagi'}
        </div>
      )}
    </div>
  );
};
