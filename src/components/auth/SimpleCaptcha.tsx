
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
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
      onValidation(isValid);
    } else {
      onValidation(false);
    }
  }, [userAnswer, correctAnswer, onValidation]);

  return (
    <div className="space-y-2">
      <Label htmlFor="captcha">Verifikasi (Jawab pertanyaan matematika)</Label>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-muted p-3 rounded-md font-mono text-lg">
          <span>{num1}</span>
          <span>{operation}</span>
          <span>{num2}</span>
          <span>=</span>
          <span>?</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generateCaptcha}
          className="p-2"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        id="captcha"
        type="number"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
        placeholder="Masukkan jawaban"
        className="w-24"
      />
    </div>
  );
};
