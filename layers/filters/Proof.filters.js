const { Types } = require("mongoose")

function get(filterData, forse={}) {
    const filter = {...filterData, ...forse}    

    let options = {}

    if(filter?.id) { options = {...options, _id: filter.id} }

    if(filter?.status) { options = {...options, status: filter.status} }

    if(filter?.invoice) { 
        let orOptions = [{ invoiceRefId: filter.invoice }, { invoicePartnerId: filter.invoice }]
        if(Types.ObjectId.isValid(filter.invoice)) {
            orOptions = [
                { invoice: filter.invoice },
                { invoiceRefId: filter.invoice }, 
                { invoicePartnerId: filter.invoice }
            ]
        }
        options = {...options,  $or: orOptions} 
    }

    if(filter?.payment) { 
        let orOptions = []
        if(Types.ObjectId.isValid(filter.payment)) { 
            orOptions = [
                { payment: filter.payment }, 
                { paymentRefId: filter.payment }, 
                { paymentPartnerId: filter.payment }
            ]
        }
        else {
            orOptions = [{ paymentRefId: filter.payment }, { paymentPartnerId: filter.payment }]
        }

        options = {...options,  $or: orOptions} 
    }

    if(filter?.bank) { options = {...options, bank: filter.bank} }
    if(filter?.kvit) { options = {...options, kvitNumber: filter.kvit} }

    if(filter?.amount?.min || filter?.amount?.max) { 
        let amountOption = {}

        if(filter?.amount?.min) { amountOption = {...amountOption, $gt: filter.amount.min} }
        if(filter?.amount?.max) { amountOption = {...amountOption, $lt: filter.amount.max} }

        options = {...options, amount: amountOption} 
    }

    if(filter?.partner?.length) { options = {...options, paymentAccessId: {$in: filter.partner} } }

    return options
}

function admin(filter) { return get(filter) }


module.exports = {
    admin
}