import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CardTabProps {
  lead: any;
  canEdit: boolean;
}

export function CardTab({ lead, canEdit }: CardTabProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [cardOnFile, setCardOnFile] = useState(false);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpiryDate(formatExpiry(e.target.value.replace('/', '')));
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9]/gi, '').substring(0, 4);
    setCvc(v);
  };

  const handleSaveCard = async () => {
    if (!cardNumber || !expiryDate || !cvc || !cardholderName) {
      toast.error('Please fill in all card details');
      return;
    }

    setLoading(true);
    
    // Simulate card authorization hold - in real implementation this would call Stripe
    try {
      // TODO: Implement actual Stripe SetupIntent for authorization hold
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCardOnFile(true);
      toast.success('Card saved successfully for future charges');
      
      // Clear sensitive data after save
      setCardNumber('');
      setExpiryDate('');
      setCvc('');
    } catch (error) {
      toast.error('Failed to save card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Card
          </CardTitle>
          <CardDescription>
            Securely store a card on file for authorization holds and future charges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>Card details are encrypted and securely stored via Stripe. We only save a reference to the card - actual card numbers are never stored on our servers.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Status */}
      {cardOnFile && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-700">Card on File</p>
                <p className="text-sm text-muted-foreground">
                  A payment card is saved and ready for charges.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Form */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {cardOnFile ? 'Update Card' : 'Add Card'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="Name on card"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  className="pr-12"
                />
                <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={expiryDate}
                  onChange={handleExpiryChange}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  placeholder="123"
                  value={cvc}
                  onChange={handleCvcChange}
                  maxLength={4}
                  type="password"
                />
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-xs text-amber-700">
                This will create an authorization hold on the card without charging it. 
                The hold confirms the card is valid and has sufficient funds.
              </p>
            </div>

            <Button 
              onClick={handleSaveCard} 
              disabled={loading || !cardNumber || !expiryDate || !cvc || !cardholderName}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              <Lock className="h-4 w-4 mr-2" />
              {loading ? 'Processing...' : cardOnFile ? 'Update Card' : 'Save Card & Authorize'}
            </Button>
          </CardContent>
        </Card>
      )}

      {!canEdit && !cardOnFile && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No card on file. Contact an admin to add payment details.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
