export const list = (state) => state.cards.list
export const filter = () => { 
    return (state) => {
        const {id, status, worker} = state.filter.cards

        let res = state.cards.list 

        if(id) { res = res.filter((card) => card._id === id) }
        if(typeof status == "boolean") { res = res.filter((card) => card.active === status) }
        if(worker) { res = res.filter((card) => card.worker === worker) }

        return res
    }
}
export const options = (state) => {
    const cards = state.cards.list 

    const options = cards.map((card) => ({ value: card._id, label: card.number }))
    options.push({ value: 'ALL', label: 'All' })

    return options
}