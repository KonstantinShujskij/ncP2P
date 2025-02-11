import useApi from '../hooks/api.hook'
import { useSelector } from 'react-redux'
import * as filterSelectors from '../redux/selectors/filter.selectors'


export default function usePaymentApi() {
    const { publicRequest, protectedRequest } = useApi()

    const filter = useSelector(filterSelectors.payment)

    const list = async (page=1, limit=20) => {       
        try { return await protectedRequest('api/payment/list', {filter, page, limit}) }
        catch(error) { return {list: [], count: 0} } 
    }

    const pool = async (page=1, limit=20) => {       
        try { return await protectedRequest('api/payment/list', {filter: {...filter, status: ['ACTIVE']}, page, limit}) }
        catch(error) { return {list: [], count: 0} } 
    }


    const block = async (card) => {       
        try { return await protectedRequest('api/payment/block', {card}) }
        catch(error) { return null } 
    }

    return { 
        list,
        pool,
        block
    }
}