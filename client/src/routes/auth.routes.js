import React from 'react'
import { Routes, Route } from 'react-router-dom'


const authRoutes = (
    <Routes>
        <Route path="/" element={<div>HYI</div>} exact />
        <Route path="*" element={<div>HYI 2</div>} exact />
    </Routes>
)     


export default authRoutes