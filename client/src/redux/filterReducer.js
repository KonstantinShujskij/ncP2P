import { SET_INVOICES, CLEAR_INVOICES } from './types/filter.types'
import { SET_PAYMENTS, CLEAR_PAYMENTS } from './types/filter.types'
import { SET_UNKNOWS, CLEAR_UNKNOWS } from './types/filter.types'
import { SET_CARDS, CLEAR_CARDS } from './types/filter.types'
import { SET_PARTNERS, CLEAR_PARTNERS } from './types/filter.types'
import { SET_WORKERS, CLEAR_WORKERS } from './types/filter.types'
import { SET_WITHDRAWS, CLEAR_WITHDRAWS } from './types/filter.types'


const initialState = {
    unknows: {
        id: '',
        card: [],
        worker: null,
        partner: null,
        amount: { min: '', max: '' },
    },
    payments: {
        id: '',
        status: null,
        card: [],
        worker: null,
        partner: null,
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
    withdraws: {
        id: '',
        worker: null,
        partner: null,
        amount: { min: '', max: '' },
    },
    cards: {
        id: '',
        status: "",
        worker: null
    },
    partners: {
        id: ''
    },
    workers: {
        id: ''
    },

    unknowTriger: false,
    paymentTriger: false,
    invoiceTriger: false,
    withdrawTriger: false,
    cardTriger: false,
    partnerTriger: false,
    workerTriger: false
}

export default function filterReducer(state=initialState, action) {
    switch(action.type) {
    case SET_UNKNOWS:
        return {...state, unknows: {...state.unknows, ...action.payload}, unknowTriger: !state.unknowTriger}
    case SET_PAYMENTS:
        return {...state, payments: {...state.payments, ...action.payload}, paymentTriger: !state.paymentTriger}
    case SET_INVOICES:
        return {...state, invoices: {...state.invoices, ...action.payload}, invoiceTriger: !state.invoiceTriger}
    case SET_CARDS:
        return {...state, cards: {...state.cards, ...action.payload}, cardTriger: !state.cardTriger}
    case SET_PARTNERS:
        return {...state, partners: {...state.partners, ...action.payload}, partnerTriger: !state.partnerTriger}
    case SET_WORKERS:
            return {...state, workers: {...state.workers, ...action.payload}, workerTriger: !state.workerTriger}
    case SET_WITHDRAWS:
        return {...state, withdraws: {...state.withdraws, ...action.payload}, withdrawTriger: !state.withdrawTriger}

    case CLEAR_UNKNOWS:
        return {...state, unknows: {...initialState.unknows}, unknowTriger: !state.unknowTriger}
    case CLEAR_PAYMENTS:
        return {...state, payments: {...initialState.payments}, paymentTriger: !state.paymentTriger}
    case CLEAR_INVOICES:
        return {...state, invoices: {...initialState.invoices}, invoiceTriger: !state.invoiceTriger}
    case CLEAR_CARDS:
        return {...state, cards: {...initialState.cards}, cardTriger: !state.cardTriger}
    case CLEAR_PARTNERS:
        return {...state, partners: {...initialState.partners}, partnerTriger: !state.partnerTriger}
    case CLEAR_WORKERS:
        return {...state, workers: {...initialState.workers}, workerTriger: !state.workerTriger}
    case CLEAR_WITHDRAWS:
        return {...state, withdraws: {...initialState.withdraws}, withdrawTriger: !state.withdrawTriger}
    default:
        return state
    }
}