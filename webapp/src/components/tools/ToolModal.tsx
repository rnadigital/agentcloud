
import { Dialog, DialogPanel, Transition } from '@headlessui/react'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/24/outline'
import Button from 'components/shared/Button';
import { useRouter } from 'next/router';
import { useState } from 'react';

import * as API from '../../api';
import mongoose from 'mongoose';

interface ToolModalProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}


const sampleCall = async () => {
    const teamId = new mongoose.Types.ObjectId();
    const toolId = new mongoose.Types.ObjectId();
    const apiKeys = new Map<string, string>([
        ['service1', 'apiKey1'],
        ['service2', 'apiKey2']
    ]);
    return {
        teamId,
        toolId,
        apiKeys
    };
}

const ToolModal = ({ open, setOpen }: ToolModalProps) => {
    const route = useRouter()
    const [imageLoaded, setImageLoaded] = useState(false);

    const { resourceSlug } = router.query;

    const onInstall = async () => {
        console.log("oninstall")
        API.addTeamTool({
            resourceSlug,
            ...sampleCall()
        })

        await API.editTool(toolState._id, {
            ...body,
            toolId: toolState._id,
        }, () => {
            toast.success('Tool Updated');
        }, (err) => {
            toast.error(err);
            setSubmitting(false);
        }, null);

        route.push(`/${route.query.resourceSlug}/mytool/${route.query.teamtoolid}/edit`)
    }

    return (
        <>
            <Transition
                show={open}
                enter="duration-200 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="duration-300 ease-out"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
            >
                <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
                    <div className="fixed inset-0 flex w-screen items-center justify-center sm:p-4 bg-gray-500/75 transition-opacity">
                        <DialogPanel className="max-w-lg border bg-white px-4 sm:px-12 pt-12 h-full sm:rounded-lg shadow-xl flex flex-col items-center relative overflow-auto space-y-4">

                            {!imageLoaded && <div className='rounded-full bg-gray-200 h-24 w-24' />}
                            <img src="https://picsum.photos/100" alt="logo" className='rounded-full'
                                onLoad={() => setImageLoaded(true)}
                            />
                            <div className='text-2xl font-bold text-gray-900'>Search LinkedIn</div>
                            <div className='text-gray-800'>By Agent Cloud</div>

                            <section className='flex flex-col sm:flex-row w-full items-center'>
                                <div className='text-center w-1/2 sm:border-r border-gray-300'>
                                    <div className='text-lg font-semibold text-gray-900'>Productivity</div>
                                    <div className='text-sm text-gray-800'>Category</div>
                                </div>
                                <div className='my-2 border-b border-gray-500 sm:hidden w-24' />
                                <div className='text-center w-1/2 sm:border-t-0 sm:border-l bordery-gray-300'>
                                    <div className='text-lg font-semibold text-gray-900'>5k+</div>
                                    <div className='text-sm text-gray-800'>Installs</div>
                                </div>
                            </section>

                            <section className='w-full flex justify-center gap-3'>
                                <div className='flex items-center gap-1'>
                                    <HandThumbUpIcon className='h-8 w-8 border border-gray-700 rounded-full p-1 text-gray-800' />
                                    <div className='text-gray-900'>5k</div>
                                </div>

                                <div className='flex items-center gap-1'>
                                    <HandThumbDownIcon className='h-8 w-8 p-1 border border-gray-700 rounded-full text-gray-800' />
                                    <div className='text-gray-900'>2k</div>
                                </div>
                            </section>


                            <p className='text-gray-800'>This tool allows you to search LinkedIn for professional profiles. It uses AI to parse the search results and return the most relevant profiles. It can be used to find potential job candidates, business partners, or industry experts.</p>

                            <section className='w-full'>
                                <div className='font-semibold text-gray-900'>Use Cases</div>
                                <ul>
                                    <li className='list-disc ml-10 text-gray-800'>Scrape job postings</li>
                                    <li className='list-disc ml-10 text-gray-800'>Scrape company profiles</li>
                                    <li className='list-disc ml-10 text-gray-800'>Scrape user profiles</li>
                                </ul>

                            </section>

                            <section className='pt-11 w-full grid grid-cols-2 text-sm text-gray-700'>

                                <div>Version</div>
                                <div className='font-medium'>1.0</div>
                                <div>Publisher</div>
                                <div className='font-medium'>Agent Cloud Team</div>
                                <div>Released On</div>
                                <div className='font-medium'>June 24, 2024</div>
                                <div>Last Updated at</div>
                                <div className='font-medium'>June 24, 2024</div>

                            </section>

                            <div className='sticky mt-0 bottom-0 w-full max-w-lg px-2 bg-white'>
                                <Button onClick={(e) => {
                                    e.stopPropagation()
                                    onInstall()
                                }} buttonText='Install' className='w-full justify-center h-12 mb-4' />
                            </div>
                        </DialogPanel>

                    </div >
                </Dialog >

            </Transition >
        </>
    )
}

export default ToolModal;