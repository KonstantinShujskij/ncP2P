import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Invoices from '../pages/Invoices/Invoices.page'
import Payments from '../pages/Payments/Payments.page'
import Pool from '../pages/Pool/Pool.page'
import Valid from '../pages/Valid/Valid.page'


const supportRoutes = (    
    <Routes>
        <Route path="/" element={<Valid />} exact />
        <Route path="/invoices" element={<Invoices />} exact />
        <Route path="/payments" element={<Payments />} exact />
        <Route path="/pool" element={<Pool />} exact />
        <Route path="/proof" element={<Valid />} exact />

        <Route path="*" element={<Valid />} exact />
    </Routes>
)     


export default supportRoutes