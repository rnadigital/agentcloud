import { PencilIcon, TrashIcon } from '@heroicons/react/20/solid'
import PageTitleWithButtons from 'components/PageTitleWithButtons'
import React, { useState } from 'react'

const MyTools = () => {

    return (
        <div>
            <PageTitleWithButtons title='InstalledTools' />

            <div className='flex flex-col justify-center items-center'>


                <section className='w-full max-w-3xl'>
                    <div className='text-lg mb-2'>My Tools</div>
                    <div className='flex gap-4 items-center border-b border-gray-200 py-4'>
                        <img src="https://picsum.photos/50" alt="logo" className="rounded-full w-12 h-12" />
                        <div>
                            <div className='text-sm font-medium text-gray-900'>Search LinkedIn</div>
                            <div className='text-sm text-gray-600 line-clamp-2'>This tool allows you to search LinkedIn for professional profiles. It uses AI to parse the search results and return the most relevant profiles. It can be used to find potential job candidates, business partners, or industry experts.</div>
                        </div>
                        <PencilIcon className='h-8 w-8 min-w-[20px] text-gray-400 cursor-pointer hover:text-black' aria-hidden='true' />
                        <TrashIcon className='h-8 w-8 min-w-[20px] text-gray-400 dark:text-white hover:text-black cursor-pointer' aria-hidden='true' />
                    </div>

                    <div className='flex gap-4 items-center border-b border-gray-200 py-4'>
                        <img src="https://picsum.photos/50" alt="logo" className="rounded-full w-12 h-12" />
                        <div>
                            <div className='text-sm font-medium text-gray-900'>Search LinkedIn</div>
                            <div className='text-sm text-gray-600 line-clamp-2'>This tool allows you to search LinkedIn for professional profiles. It uses AI to parse the search results and return the most relevant profiles. It can be used to find potential job candidates, business partners, or industry experts.</div>
                        </div>
                        <PencilIcon className='h-8 w-8 min-w-[20px] text-gray-400 dark:text-white hover:text-black cursor-pointer' aria-hidden='true' />
                        <TrashIcon className='h-8 w-8 min-w-[20px] text-gray-400 dark:text-white hover:text-black cursor-pointer' aria-hidden='true' />
                    </div>
                </section>
                <section className='w-full max-w-3xl mt-6'>
                    <div className='text-lg mb-2'>My Tools</div>
                </section>
            </div>

        </div>
    )
}

export default MyTools

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
    return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};