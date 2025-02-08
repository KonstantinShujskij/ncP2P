export const list = (state) => state.partners.list

export const filter = () => { 
    return (state) => {
        const { id } = state.filter.partners

        let res = state.partners.list 

        if(id) { res = res.filter((partner) => partner._id === id) }

        return res
    }
}
export const options = (state) => {
    const partners = state.partners.list 

    const options = partners.map((partner) => ({ value: partner._id, label: partner.name }))
    options.push({ value: undefined, label: 'All' })
    options.unshift({ value: "Not Define", label: "Not Define" })


    return options
}
export const dryOptions = (state) => { return state.partners.list.map((partner) => ({ value: partner._id, label: partner.name })) }