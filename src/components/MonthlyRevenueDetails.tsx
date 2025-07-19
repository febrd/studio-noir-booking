
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MonthlyDetail {
  item: string;
  category: string;
  sessions_count: number;
  sessions_per_day: number;
  sessions_per_package: number;
  revenue: number;
  avg_transaction_item: number;
  avg_transaction_category: number;
}

interface MonthlyRevenueDetailsProps {
  monthlyDetails: MonthlyDetail[];
  startDate: Date;
  endDate: Date;
}

export const MonthlyRevenueDetails = ({ monthlyDetails, startDate, endDate }: MonthlyRevenueDetailsProps) => {
  const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Group data by studio type for the second table
  const studioTypeMapping: Record<string, string> = {
    'Self Photo': 'Studio Self Photo',
    'Regular': 'Studio Reguler', 
    'Photobooth': 'Studio Photobooth',
    'Unknown': 'Lain-Lain'
  };

  // Group by studio type instead of item
  const groupedByStudioType = monthlyDetails.reduce((acc, detail) => {
    // Map the item to studio type categories
    let studioType = 'Lain-Lain'; // default
    
    if (detail.item.toLowerCase().includes('self') || detail.item.toLowerCase().includes('selfie')) {
      studioType = 'Studio Self Photo';
    } else if (detail.item.toLowerCase().includes('regular') || detail.item.toLowerCase().includes('foto')) {
      studioType = 'Studio Reguler';
    } else if (detail.item.toLowerCase().includes('booth')) {
      studioType = 'Studio Photobooth';
    }
    
    if (!acc[studioType]) {
      acc[studioType] = {
        totalSessions: 0,
        totalRevenue: 0,
        packages: []
      };
    }
    acc[studioType].totalSessions += detail.sessions_count;
    acc[studioType].totalRevenue += detail.revenue;
    acc[studioType].packages.push(detail);
    return acc;
  }, {} as Record<string, { totalSessions: number; totalRevenue: number; packages: MonthlyDetail[] }>);

  // Group data by item type for first table
  const groupedByItem = monthlyDetails.reduce((acc, detail) => {
    if (!acc[detail.item]) {
      acc[detail.item] = {
        totalSessions: 0,
        totalRevenue: 0,
        packages: []
      };
    }
    acc[detail.item].totalSessions += detail.sessions_count;
    acc[detail.item].totalRevenue += detail.revenue;
    acc[detail.item].packages.push(detail);
    return acc;
  }, {} as Record<string, { totalSessions: number; totalRevenue: number; packages: MonthlyDetail[] }>);

  // Calculate daily averages by studio type for second table
  const dailyAveragesByStudioType = Object.entries(groupedByStudioType).map(([studioType, data]) => ({
    studioType,
    avgSessionsPerDay: data.totalSessions / daysInPeriod,
    avgRevenuePerDay: data.totalRevenue / daysInPeriod
  }));

  // Sort studio types in the desired order
  const studioTypeOrder = ['Studio Self Photo', 'Studio Reguler', 'Studio Photobooth', 'Lain-Lain'];
  dailyAveragesByStudioType.sort((a, b) => {
    const indexA = studioTypeOrder.indexOf(a.studioType);
    const indexB = studioTypeOrder.indexOf(b.studioType);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const totalSessions = Object.values(groupedByItem).reduce((sum, item) => sum + item.totalSessions, 0);
  const totalRevenue = Object.values(groupedByItem).reduce((sum, item) => sum + item.totalRevenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detail Pendapatan Perbulan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tabel Pertama: Rincian Pendapatan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">🧾 Rincian Pendapatan</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">Item</TableHead>
                    <TableHead className="font-bold">Paket</TableHead>
                    <TableHead className="font-bold">Jumlah Item Terjual</TableHead>
                    <TableHead className="font-bold">Jumlah Paket Terjual</TableHead>
                    <TableHead className="font-bold">Pendapatan per Item</TableHead>
                    <TableHead className="font-bold">Pendapatan per Paket</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedByItem).map(([item, itemData]) => (
                    itemData.packages.map((packageDetail, index) => (
                      <TableRow key={`${item}-${packageDetail.category}`}>
                        <TableCell className={index === 0 ? "font-medium" : ""}>
                          {index === 0 ? item : ""}
                        </TableCell>
                        <TableCell>{packageDetail.category}</TableCell>
                        <TableCell>
                          {index === 0 ? itemData.totalSessions : ""}
                        </TableCell>
                        <TableCell>{packageDetail.sessions_count}</TableCell>
                        <TableCell>
                          {index === 0 ? `Rp ${itemData.totalRevenue.toLocaleString('id-ID')}` : ""}
                        </TableCell>
                        <TableCell>Rp {packageDetail.revenue.toLocaleString('id-ID')}</TableCell>
                      </TableRow>
                    ))
                  ))}
                  <TableRow className="bg-blue-50 font-bold">
                    <TableCell colSpan={4}>Total Revenue</TableCell>
                    <TableCell>Rp {totalRevenue.toLocaleString('id-ID')}</TableCell>
                    <TableCell>Rp {totalRevenue.toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Tabel Kedua: Rata-rata Perhari berdasarkan Studio Type */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">📊 Rata-rata Perhari</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">Item</TableHead>
                    <TableHead className="font-bold">Rata-rata Transaksi/Hari</TableHead>
                    <TableHead className="font-bold">Rata-rata Pendapatan/Hari</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyAveragesByStudioType.map((avg) => (
                    <TableRow key={avg.studioType}>
                      <TableCell className="font-medium">{avg.studioType}</TableCell>
                      <TableCell>{avg.avgSessionsPerDay.toFixed(1)}</TableCell>
                      <TableCell>Rp {avg.avgRevenuePerDay.toLocaleString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell>{(totalSessions / daysInPeriod).toFixed(1)}</TableCell>
                    <TableCell>Rp {(totalRevenue / daysInPeriod).toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
