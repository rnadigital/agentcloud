import { Controller, useFormContext } from "react-hook-form";
import clsx from "clsx";
import Tippy from "@tippyjs/react";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import { useEffect } from "react";
import { FormFieldProps } from "lib/types/connectorform/form";
import { capitalizeFirstLetter } from "utils/capitalizeFirstLetter";
import { toSentenceCase } from "utils/toSentenceCase";

const InputField = ({
    name,
    testId,
    type,
    disabled,
    property,
    isRequired
}: FormFieldProps) => {

    const { control, setValue } = useFormContext()

    useEffect(() => {
        if (property.const) {
            setValue(name, property.const);
        }
    }, [setValue, property, name])


    return (
        <Controller
            name={name}
            control={control}
            rules={{
                required: isRequired && `${property.title ? property.title : toSentenceCase(name)} is required.`
            }}
            render={({ field, fieldState }) => {
                return (
                    <div>
                        <div className="flex items-center">
                            <label htmlFor={name} className="mr-1">
                                {property.title ? property.title : toSentenceCase(name)}
                            </label>
                            {property.description && <Tippy content={property.description}>
                                <div className="cursor-pointer">
                                    <InformationCircleIcon className="h-4 w-4" />
                                </div>
                            </Tippy>}
                        </div>
                        <input
                            {...field}
                            name={name}
                            type={type}
                            autoComplete="on"
                            data-testid={testId}
                            disabled={disabled}
                            onChange={(e) => field.onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)} // Transform value to number
                            className={clsx(
                                type !== "checkbox" && "mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 px-2",
                                {
                                    "ring-gray-300 focus:ring-indigo-600": !fieldState.error,
                                    "ring-red-500 focus:ring-red-500": fieldState.error,
                                    "bg-gray-200 cursor-not-allowed": disabled,
                                    "appearance-none": type === "date", // Add this line
                                    "h-5 align-left w-5 mt-2": type === "checkbox", // Add this line
                                }
                            )}
                        />
                        <div className="text-red-500 mt-2 text-xs">
                            {fieldState.error && capitalizeFirstLetter(fieldState.error.message)}
                        </div>
                    </div>
                );
            }}
        />
    );
}

export default InputField;