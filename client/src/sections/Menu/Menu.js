import React from 'react'
import { NavLink } from 'react-router-dom'

import useAuth from '../../hooks/auth.hook'
// import { useSelector } from 'react-redux'
// import * as selectors from '../redux/selectors/user.selectors'

import styles from './Menu.module.css'


function Menu() {
    const { logout } = useAuth()

    return (
        <div className={styles.main}>
            <div className={styles.menu}>
                <NavLink to={'./statistic'} className={styles.item}>
                    <div className={styles.icon}>
                        ⚛️ 
                    </div>
                    <div className={styles.value}>
                        Dashboard
                    </div>
                </NavLink>
                <NavLink to={'./invoices'} className={styles.item}>
                    <div className={styles.icon}>
                        ➡️
                    </div>
                    <div className={styles.value}>
                        Pay-in
                    </div>
                </NavLink>
                <NavLink to={'./payments'} className={styles.item}>
                    <div className={styles.icon}>
                        ⬅️
                    </div>
                    <div className={styles.value}>
                        Pay-out
                    </div>
                </NavLink>
                <NavLink to={'./pool'} className={styles.item}>
                    <div className={styles.icon}>
                        #️⃣
                    </div>
                    <div className={styles.value}>
                        Pool
                    </div>
                </NavLink>
                <NavLink to={'./proof'} className={styles.item}>
                    <div className={styles.icon}>
                        🆘
                    </div>
                    <div className={styles.value}>
                        Proof
                    </div>
                </NavLink>
            </div>
            <div className={styles.logout}>
                <div className={styles.item} onClick={logout}>
                    <div className={styles.icon}>
                        ❎
                    </div>
                    <div className={styles.value}>
                        Logout
                    </div>
                </div>
            </div>
        </div>
    )
}


export default Menu