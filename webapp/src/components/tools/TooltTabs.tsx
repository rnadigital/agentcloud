import classNames from 'components/ClassNames'
import React from 'react'

const tabs = [
    { name: 'Writing', href: '#', current: false },
    { name: 'Productivity', href: '#', current: false },
    { name: 'Research & Analysis', href: '#', current: true },
    { name: 'Education', href: '#', current: false },
]

const ToolTabs = () => {
    return (
        <div className="w-full my-4 flex justify-center overflow-x-auto scrollbar-none">

            <div className="flex justify-center w-full md:w-fit">
                <div className="border-b border-gray-200 w-full overflow-x-auto scrollbar-none">
                    <nav className="-mb-px space-x-8 justify-center inline-flex" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <a
                                key={tab.name}
                                href={tab.href}
                                className={classNames(
                                    tab.current
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                                    'whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
                                )}
                                aria-current={tab.current ? 'page' : undefined}
                            >
                                {tab.name}
                            </a>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    )
}

export default ToolTabs