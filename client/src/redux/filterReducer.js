import { SET_INVOICES, CLEAR_INVOICES } from './types/filter.types'
import { SET_PAYMENTS, CLEAR_PAYMENTS } from './types/filter.types'


const initialState = {
    payments: {
        id: '',
        refId: '',
        partnerId: '',

        card: '',
        status: null,

        initialAmount: { min: '', max: '' },
        currentAmount: { min: '', max: '' },
        amount: { min: '', max: '' },
    },
    invoices: {
        id: '',
        status: null,
        card: [],
        worker: null,
        partner: null,
        clientId: null,
        amount: { min: '', max: '' },
    },

    paymentTriger: false,
    invoiceTriger: false
}

export default function filterReducer(state=initialState, action) {
    switch(action.type) {
    case SET_PAYMENTS:
        return {...state, payments: {...state.payments, ...action.payload}, paymentTriger: !state.paymentTriger}
    case SET_INVOICES:
        return {...state, invoices: {...state.invoices, ...action.payload}, invoiceTriger: !state.invoiceTriger}

    case CLEAR_PAYMENTS:
        return {...state, payments: {...initialState.payments}, paymentTriger: !state.paymentTriger}
    case CLEAR_INVOICES:
        return {...state, invoices: {...initialState.invoices}, invoiceTriger: !state.invoiceTriger}
    default:
        return state
    }
}