import api from './axiosClient';

export interface ReportData {
    salesOrders: number;
    salesAmount: number;
    receiptCash: number;
    receiptBank: number;
    postPayment: number;
  	orderToPrepay: number;
		orderPreparing: number;
		orderTransporting: number;
}

export const getReportData = async (startDate: string, endDate: string) => {
    const reportData = {
        _type: 'XTSGetReportDataRequest',
        _dbId: '',
        _msgId: '',
        reportName: 'Dashboard',
        startDate,
        endDate,
        conditions: [
            {
                _type: 'XTSCondition',
                property: 'company',
                value: {
                    _type: 'XTSObjectId',
                    id: 'a4e5cb74-5b27-11ef-a699-00155d058802',
                    dataType: 'XTSCompany',
                    presentation: 'Cửa hàng Dung-Baby',
                    navigationRef: null
                },
                comparisonOperator: '='
            }
        ]
    };

    try {
        const response = await api.post('', reportData);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch report data');
    }
};