import { DollarSign } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { useAuthStore } from '../../store/authStore';
import { canEdit } from '../../utils/permissions';
import { toast } from 'sonner';

export default function Finance() {
  const user = useAuthStore((state) => state.user);
  const canManageFinance = user && canEdit(user.role, 'finance');
  const [transactions, setTransactions] = useState([
    { id: 1, description: 'Material Purchase', amount: 50000, type: 'expense', date: '2026-02-15', reference: 'MAT-001', vendor: 'ABC Suppliers', category: 'Materials' },
    { id: 2, description: 'Client Payment', amount: 100000, type: 'income', date: '2026-02-14', reference: 'INV-2026-001', vendor: 'BuildCorp Ltd', category: 'Project Income' },
    { id: 3, description: 'Labor Costs', amount: 35000, type: 'expense', date: '2026-02-13', reference: 'LAB-001', vendor: 'Internal Team', category: 'Labor' },
    { id: 4, description: 'Equipment Rental', amount: 15000, type: 'expense', date: '2026-02-12', reference: 'EQ-001', vendor: 'Equipment Plus', category: 'Equipment' },
  ]);
  const [newTransaction, setNewTransaction] = useState({ description: '', amount: '', type: 'expense' });
  const [selectedTransaction, setSelectedTransaction] = useState<typeof transactions[0] | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount) {
      toast.error('All fields are required');
      return;
    }
    const transaction = {
      id: transactions.length + 1,
      description: newTransaction.description,
      amount: parseInt(newTransaction.amount),
      type: newTransaction.type as 'income' | 'expense',
      date: new Date().toISOString().split('T')[0],
    };
    setTransactions([...transactions, transaction]);
    setNewTransaction({ description: '', amount: '', type: 'expense' });
    toast.success('Transaction recorded successfully!');
  };

  const getTypeColor = (type: string) => {
    return type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const handleViewDetails = (transaction: typeof transactions[0]) => {
    setSelectedTransaction(transaction);
    setDetailsDialogOpen(true);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-500 mt-1">Budget tracking and financial analysis</p>
        </div>        {canManageFinance ? (        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
              + Record Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Transaction</DialogTitle>
              <DialogDescription>
                Add a new income or expense transaction
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Material Purchase"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 50000"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trans-type">Type</Label>
                <select 
                  id="trans-type"
                  className="w-full px-3 py-2 border rounded-md"
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                onClick={handleAddTransaction}
              >
                Record Transaction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        ) : (
          <Button disabled className="opacity-50 cursor-not-allowed">
            + Record Transaction (No Permission)
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIncome.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalExpense.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(totalIncome - totalExpense).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{transaction.description}</h3>
                  <p className="text-sm text-gray-500 mt-1">{transaction.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getTypeColor(transaction.type)}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => handleViewDetails(transaction)}>
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about this transaction
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Type</p>
                  <Badge className={getTypeColor(selectedTransaction.type)}>
                    {selectedTransaction.type === 'income' ? 'Income' : 'Expense'}
                  </Badge>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className={`text-lg font-bold ${selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTransaction.type === 'income' ? '+' : '-'}${selectedTransaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="font-semibold text-gray-900">{selectedTransaction.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reference</p>
                  <p className="font-mono text-sm text-gray-900">{selectedTransaction.reference}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="text-gray-900">{selectedTransaction.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Vendor/Source</p>
                  <p className="text-gray-900">{selectedTransaction.vendor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Date</p>
                  <p className="text-gray-900">{new Date(selectedTransaction.date).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    toast.success('Transaction exported to PDF');
                  }}
                >
                  Export
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
