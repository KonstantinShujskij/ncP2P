module.exports = {
    payTime: 15 * 60 * 1000,
    minPaymentLimit: 500,
    maxPaymentLimit: 100000,
    minInvoiceLimit: 500,
    maxInvoiceLimit: 30000,
    minNcApiLimit: 500,
    smallLim: 1500,
    
    payment: {
        statusList: { ACTIVE: 'ACTIVE', BLOCKED: 'BLOCKED', SUCCESS: 'SUCCESS', REJECT: 'REJECT' },
        minLimit: {
            default: 500,
            customLimit: 10000,
            persent: 0.05
        }
    },

    invoice: {
        statusList: { WAIT: 'WAIT', VALID: 'VALID', CONFIRM: 'CONFIRM', REJECT: 'REJECT' },
        activeStatusList: [ 'VALID', 'WAIT' ],
        finaleStatusList: [ 'CONFIRM', 'REJECT' ]
    },

    proof: {
        statusList: { WAIT: "WAIT", MANUAL: 'MANUAL', CONFIRM: 'CONFIRM', REJECT: 'REJECT' },
        activeStatusList: [ 'WAIT', 'MANUAL' ],
    },

    maxSaveRecursion: 10,
    bankList: { MONO: 'mono', PRIVAT: 'privat' },
    access: { PARTNER: 'PARTNER', ADMIN: 'ADMIN' },
    expire: 15
}
