'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageHeader from '@/components/PageHeader';
import { Card, StatCard } from '@/components/Card';
import Button from '@/components/Button';
import { HospitalApiService } from '@/lib/services/hospital.service';
import { 
  DollarSign, 
  CreditCard, 
  FileText, 
  Download, 
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Eye,
  Edit,
  Send,
  User,
  Building,
  TrendingUp,
  TrendingDown,
  Activity,
  Receipt,
  Banknote,
  Wallet,
  Loader2
} from 'lucide-react';

interface Bill {
  id: string;
  billNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  department: string;
  services: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'partial';
  paymentMethod?: 'cash' | 'card' | 'insurance' | 'bank_transfer' | 'check';
  insuranceProvider?: string;
  insuranceClaim?: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
}

interface Payment {
  id: string;
  billId: string;
  amount: number;
  method: 'cash' | 'card' | 'insurance' | 'bank_transfer' | 'check';
  transactionId?: string;
  paidDate: string;
  notes?: string;
}

interface BillingApiData {
  summary: {
    totalRevenue: number;
    totalBilled: number;
    totalPending: number;
    insuranceClaims: number;
  };
  byDepartment: Array<{
    name: string;
    revenue: number;
    bills: number;
    paid: number;
    pending: number;
  }>;
  byDoctor: Array<{
    name: string;
    revenue: number;
    bills: number;
  }>;
}

export default function HospitalBillingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'bills' | 'payments' | 'reports'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // API state
  const [billingData, setBillingData] = useState<BillingApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch billing data from API
  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await HospitalApiService.getBillingReports();
        setBillingData(response);
      } catch (err: any) {
        console.error('Error fetching billing data:', err);
        setError(err.message || 'Failed to fetch billing data');
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  // Mock data
  const bills: Bill[] = [
    {
      id: 'BILL001',
      billNumber: 'HB-2024-001',
      patientId: 'P001',
      patientName: 'Sarah Johnson',
      patientPhone: '+1-555-0123',
      patientEmail: 'sarah.johnson@email.com',
      doctorId: 'D001',
      doctorName: 'Dr. Sarah Wilson',
      department: 'Cardiology',
      services: [
        { description: 'Cardiology Consultation', quantity: 1, unitPrice: 200, total: 200 },
        { description: 'ECG Test', quantity: 1, unitPrice: 150, total: 150 },
        { description: 'Blood Test - Lipid Profile', quantity: 1, unitPrice: 80, total: 80 }
      ],
      subtotal: 430,
      tax: 43,
      discount: 0,
      totalAmount: 473,
      paidAmount: 473,
      balanceAmount: 0,
      status: 'paid',
      paymentMethod: 'insurance',
      insuranceProvider: 'BlueCross BlueShield',
      insuranceClaim: 'BC-2024-7821',
      issueDate: '2024-07-20',
      dueDate: '2024-08-20',
      paidDate: '2024-07-22'
    },
    {
      id: 'BILL002',
      billNumber: 'HB-2024-002',
      patientId: 'P002',
      patientName: 'Robert Martinez',
      patientPhone: '+1-555-0125',
      patientEmail: 'robert.martinez@email.com',
      doctorId: 'D002',
      doctorName: 'Dr. Michael Chen',
      department: 'Neurology',
      services: [
        { description: 'Neurology Consultation', quantity: 1, unitPrice: 250, total: 250 },
        { description: 'MRI Brain Scan', quantity: 1, unitPrice: 800, total: 800 },
        { description: 'Neurological Assessment', quantity: 1, unitPrice: 180, total: 180 }
      ],
      subtotal: 1230,
      tax: 123,
      discount: 50,
      totalAmount: 1303,
      paidAmount: 500,
      balanceAmount: 803,
      status: 'partial',
      paymentMethod: 'card',
      issueDate: '2024-07-18',
      dueDate: '2024-08-18'
    },
    {
      id: 'BILL003',
      billNumber: 'HB-2024-003',
      patientId: 'P003',
      patientName: 'Emily Chen',
      patientPhone: '+1-555-0127',
      patientEmail: 'emily.chen@email.com',
      doctorId: 'D003',
      doctorName: 'Dr. Emily Rodriguez',
      department: 'Pediatrics',
      services: [
        { description: 'Pediatric Consultation', quantity: 1, unitPrice: 150, total: 150 },
        { description: 'Vaccination - MMR', quantity: 1, unitPrice: 45, total: 45 },
        { description: 'General Health Checkup', quantity: 1, unitPrice: 100, total: 100 }
      ],
      subtotal: 295,
      tax: 29.5,
      discount: 20,
      totalAmount: 304.5,
      paidAmount: 0,
      balanceAmount: 304.5,
      status: 'pending',
      issueDate: '2024-07-22',
      dueDate: '2024-08-22'
    },
    {
      id: 'BILL004',
      billNumber: 'HB-2024-004',
      patientId: 'P004',
      patientName: 'Michael Davis',
      patientPhone: '+1-555-0129',
      patientEmail: 'michael.davis@email.com',
      doctorId: 'D004',
      doctorName: 'Dr. James Thompson',
      department: 'Oncology',
      services: [
        { description: 'Oncology Consultation', quantity: 1, unitPrice: 300, total: 300 },
        { description: 'CT Scan - Chest', quantity: 1, unitPrice: 600, total: 600 },
        { description: 'Biopsy Procedure', quantity: 1, unitPrice: 450, total: 450 },
        { description: 'Pathology Analysis', quantity: 1, unitPrice: 200, total: 200 }
      ],
      subtotal: 1550,
      tax: 155,
      discount: 100,
      totalAmount: 1605,
      paidAmount: 0,
      balanceAmount: 1605,
      status: 'overdue',
      issueDate: '2024-06-15',
      dueDate: '2024-07-15'
    },
    {
      id: 'BILL005',
      billNumber: 'HB-2024-005',
      patientId: 'P005',
      patientName: 'Lisa Anderson',
      patientPhone: '+1-555-0131',
      patientEmail: 'lisa.anderson@email.com',
      doctorId: 'D005',
      doctorName: 'Dr. Lisa Wang',
      department: 'Orthopedics',
      services: [
        { description: 'Orthopedic Consultation', quantity: 1, unitPrice: 180, total: 180 },
        { description: 'X-Ray - Knee', quantity: 2, unitPrice: 120, total: 240 },
        { description: 'Physical Therapy Session', quantity: 5, unitPrice: 75, total: 375 }
      ],
      subtotal: 795,
      tax: 79.5,
      discount: 0,
      totalAmount: 874.5,
      paidAmount: 874.5,
      balanceAmount: 0,
      status: 'paid',
      paymentMethod: 'bank_transfer',
      issueDate: '2024-07-10',
      dueDate: '2024-08-10',
      paidDate: '2024-07-15'
    }
  ];

  const payments: Payment[] = [
    {
      id: 'PAY001',
      billId: 'BILL001',
      amount: 473,
      method: 'insurance',
      transactionId: 'INS-BC-7821',
      paidDate: '2024-07-22',
      notes: 'Insurance claim processed'
    },
    {
      id: 'PAY002',
      billId: 'BILL002',
      amount: 500,
      method: 'card',
      transactionId: 'CARD-4532',
      paidDate: '2024-07-20',
      notes: 'Partial payment via credit card'
    },
    {
      id: 'PAY003',
      billId: 'BILL005',
      amount: 874.5,
      method: 'bank_transfer',
      transactionId: 'BT-78945612',
      paidDate: '2024-07-15',
      notes: 'Bank transfer payment'
    }
  ];

  const departments = ['all', 'Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Orthopedics', 'Emergency'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'partial': return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-gray-600" />;
      default: return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'insurance': return <Building className="w-4 h-4" />;
      case 'bank_transfer': return <Wallet className="w-4 h-4" />;
      case 'check': return <Receipt className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || bill.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Statistics - Use API data when available, fallback to mock data
  const getStatistics = () => {
    if (billingData) {
      return {
        totalBills: bills.length, // Keep bill count from mock for now
        totalRevenue: billingData.summary.totalBilled || billingData.summary.totalRevenue || 0,
        totalPaid: billingData.summary.totalRevenue || 0,
        totalOutstanding: billingData.summary.totalPending || 0,
        paidBills: bills.filter(bill => bill.status === 'paid').length,
        overdueBills: bills.filter(bill => bill.status === 'overdue').length,
        pendingBills: bills.filter(bill => bill.status === 'pending').length,
        insuranceClaims: billingData.summary.insuranceClaims || 0
      };
    }
    
    // Fallback to mock data
    return {
      totalBills: bills.length,
      totalRevenue: bills.reduce((sum, bill) => sum + bill.totalAmount, 0),
      totalPaid: bills.reduce((sum, bill) => sum + bill.paidAmount, 0),
      totalOutstanding: bills.reduce((sum, bill) => sum + bill.balanceAmount, 0),
      paidBills: bills.filter(bill => bill.status === 'paid').length,
      overdueBills: bills.filter(bill => bill.status === 'overdue').length,
      pendingBills: bills.filter(bill => bill.status === 'pending').length,
      insuranceClaims: 0
    };
  };

  const stats = getStatistics();

  // Department revenue - Use API data when available
  const getDepartmentRevenue = () => {
    if (billingData && billingData.byDepartment.length > 0) {
      return billingData.byDepartment.map(dept => ({
        name: dept.name,
        revenue: dept.revenue,
        paid: dept.paid || dept.revenue,
        outstanding: dept.pending || 0,
        bills: dept.bills
      }));
    }
    
    // Fallback to mock calculation
    return departments.slice(1).map(dept => {
      const deptBills = bills.filter(bill => bill.department === dept);
      return {
        name: dept,
        revenue: deptBills.reduce((sum, bill) => sum + bill.totalAmount, 0),
        paid: deptBills.reduce((sum, bill) => sum + bill.paidAmount, 0),
        outstanding: deptBills.reduce((sum, bill) => sum + bill.balanceAmount, 0),
        bills: deptBills.length
      };
    });
  };

  const departmentRevenue = getDepartmentRevenue();

  const handleBillSelect = (bill: Bill) => {
    setSelectedBill(bill);
    setShowBillModal(true);
  };

  const handleRecordPayment = (bill: Bill) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
  };

  return (
    <ProtectedRoute allowedRoles={['hospital_admin']}>
      <div className="space-y-6">
        <PageHeader
          title="Billing & Revenue"
          description="Manage hospital billing, payments, and financial reporting"
        >
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Create Bill
            </Button>
          </div>
        </PageHeader>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading billing data...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
            <p className="text-red-600 text-sm mt-2">
              Showing fallback data. Please try refreshing the page.
            </p>
          </div>
        )}

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            change={{ value: "All time revenue", trend: "up" }}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
          />
          <StatCard
            title="Amount Collected"
            value={`$${stats.totalPaid.toLocaleString()}`}
            change={{ value: `${Math.round((stats.totalPaid / stats.totalRevenue) * 100)}% collection rate`, trend: "up" }}
            icon={<CheckCircle className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Outstanding Amount"
            value={`$${stats.totalOutstanding.toLocaleString()}`}
            change={{ value: `${stats.overdueBills} overdue bills`, trend: "down" }}
            icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          />
          <StatCard
            title="Total Bills"
            value={stats.totalBills.toString()}
            change={{ value: `${stats.paidBills} paid, ${stats.pendingBills} pending`, trend: "neutral" }}
            icon={<FileText className="w-6 h-6 text-purple-600" />}
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('bills')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Bills ({stats.totalBills})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-4 h-4 inline mr-2" />
              Payments ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Reports
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Department Revenue */}
            <Card title="Department Revenue Breakdown">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departmentRevenue.map((dept) => (
                  <div key={dept.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                      <span className="text-sm text-gray-500">{dept.bills} bills</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Revenue:</span>
                        <span className="font-medium text-green-600">${dept.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Collected:</span>
                        <span className="font-medium text-blue-600">${dept.paid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Outstanding:</span>
                        <span className="font-medium text-red-600">${dept.outstanding.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Collection Rate:</span>
                        <span className="font-medium">
                          {dept.revenue > 0 ? Math.round((dept.paid / dept.revenue) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card title="Recent Financial Activity">
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => {
                  const bill = bills.find(b => b.id === payment.billId);
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          {getPaymentMethodIcon(payment.method)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            ${payment.amount.toLocaleString()} payment received
                          </p>
                          <p className="text-sm text-gray-600">
                            {bill?.patientName} • {bill?.billNumber} • {payment.method.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{new Date(payment.paidDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {(activeTab === 'bills' || activeTab === 'payments') && (
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search bills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept === 'all' ? 'All Departments' : dept}
                    </option>
                  ))}
                </select>

                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'bills' && (
          <Card title={`Bills (${filteredBills.length} found)`}>
            <div className="space-y-4">
              {filteredBills.map((bill) => (
                <div 
                  key={bill.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleBillSelect(bill)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{bill.billNumber}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                            {getStatusIcon(bill.status)}
                            <span className="ml-1 capitalize">{bill.status}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Patient: {bill.patientName} • Doctor: {bill.doctorName}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Department: {bill.department}</span>
                          <span>Issue: {new Date(bill.issueDate).toLocaleDateString()}</span>
                          <span>Due: {new Date(bill.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">${bill.totalAmount.toLocaleString()}</p>
                      {bill.balanceAmount > 0 && (
                        <p className="text-sm text-red-600">Balance: ${bill.balanceAmount.toLocaleString()}</p>
                      )}
                      {bill.paidAmount > 0 && (
                        <p className="text-sm text-green-600">Paid: ${bill.paidAmount.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex space-x-4 text-sm text-gray-500">
                      <span>{bill.services.length} services</span>
                      {bill.insuranceProvider && (
                        <span>Insurance: {bill.insuranceProvider}</span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBillSelect(bill);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {bill.balanceAmount > 0 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecordPayment(bill);
                          }}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Record Payment"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-1 text-purple-600 hover:text-purple-800" title="Send Bill">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredBills.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bills found</h3>
                <p className="text-gray-500">No bills match your current search criteria.</p>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'payments' && (
          <Card title={`Recent Payments (${payments.length} payments)`}>
            <div className="space-y-4">
              {payments.map((payment) => {
                const bill = bills.find(b => b.id === payment.billId);
                return (
                  <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          {getPaymentMethodIcon(payment.method)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            ${payment.amount.toLocaleString()} Payment
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            Bill: {bill?.billNumber} • Patient: {bill?.patientName}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="capitalize">Method: {payment.method.replace('_', ' ')}</span>
                            <span>Date: {new Date(payment.paidDate).toLocaleDateString()}</span>
                            {payment.transactionId && (
                              <span>Transaction: {payment.transactionId}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </span>
                      </div>
                    </div>

                    {payment.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{payment.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card title="Financial Reports">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Monthly Revenue Report</h3>
                  <p className="text-sm text-gray-600 mb-4">Detailed breakdown of monthly revenue by department</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Outstanding Bills Report</h3>
                  <p className="text-sm text-gray-600 mb-4">List of all pending and overdue bills</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Payment Analysis</h3>
                  <p className="text-sm text-gray-600 mb-4">Payment methods and collection efficiency</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Insurance Claims</h3>
                  <p className="text-sm text-gray-600 mb-4">Insurance billing and claim status</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Tax Summary</h3>
                  <p className="text-sm text-gray-600 mb-4">Tax collected and payable amounts</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Financial Dashboard</h3>
                  <p className="text-sm text-gray-600 mb-4">Comprehensive financial overview</p>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Bill Details Modal */}
        {showBillModal && selectedBill && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Bill Details - {selectedBill.billNumber}</h3>
                  <button 
                    onClick={() => setShowBillModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Patient Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Patient Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <span className="ml-2 font-medium">{selectedBill.patientName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <span className="ml-2 font-medium">{selectedBill.patientPhone}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2 font-medium">{selectedBill.patientEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Doctor & Department */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Service Provider</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Doctor:</span>
                        <span className="ml-2 font-medium">{selectedBill.doctorName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Department:</span>
                        <span className="ml-2 font-medium">{selectedBill.department}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Services & Charges</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedBill.services.map((service, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {service.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {service.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${service.unitPrice}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${service.total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>${selectedBill.subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax:</span>
                        <span>${selectedBill.tax}</span>
                      </div>
                      {selectedBill.discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount:</span>
                          <span className="text-green-600">-${selectedBill.discount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Amount:</span>
                        <span>${selectedBill.totalAmount}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Paid Amount:</span>
                        <span>${selectedBill.paidAmount}</span>
                      </div>
                      {selectedBill.balanceAmount > 0 && (
                        <div className="flex justify-between text-red-600 font-semibold">
                          <span>Balance Due:</span>
                          <span>${selectedBill.balanceAmount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Bill Information</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedBill.status)}`}>
                          {getStatusIcon(selectedBill.status)}
                          <span className="ml-1 capitalize">{selectedBill.status}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Issue Date:</span>
                        <span className="ml-2 font-medium">{new Date(selectedBill.issueDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Due Date:</span>
                        <span className="ml-2 font-medium">{new Date(selectedBill.dueDate).toLocaleDateString()}</span>
                      </div>
                      {selectedBill.paidDate && (
                        <div>
                          <span className="text-gray-500">Paid Date:</span>
                          <span className="ml-2 font-medium">{new Date(selectedBill.paidDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedBill.insuranceProvider && (
                        <div>
                          <span className="text-gray-500">Insurance:</span>
                          <span className="ml-2 font-medium">{selectedBill.insuranceProvider}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button variant="outline" onClick={() => setShowBillModal(false)} className="flex-1">
                    Close
                  </Button>
                  <Button variant="primary" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  {selectedBill.balanceAmount > 0 && (
                    <Button variant="success" className="flex-1" onClick={() => handleRecordPayment(selectedBill)}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Record Payment
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
