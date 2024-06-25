import { Controller, type Path } from "react-hook-form";
import type { Control, FieldValues, RegisterOptions } from "react-hook-form";
import clsx from "clsx";

interface FormFieldProps<TFieldValues extends FieldValues> {
    name: Path<TFieldValues>;
    control: Control<TFieldValues>;
    rules: RegisterOptions<TFieldValues>;
    label: string;
    testId?: string;
    type: string;
    autofocus?: boolean;
    disabled?: boolean;
}

const InputField = <TFieldValues extends FieldValues>({
    name,
    control,
    rules,
    label,
    testId,
    type,
    autofocus,
    disabled,
}: FormFieldProps<TFieldValues>) => {
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field, fieldState }) => {
                return (
                    <div className="max-w-2xl"
                    >
                        <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                            {label}
                        </label>
                        <input
                            {...field}
                            name={label}
                            type={type}
                            autoComplete="on"
                            autoFocus={autofocus}
                            data-testid={testId}
                            disabled={disabled}
                            className={clsx(
                                "mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6",
                                {
                                    "ring-gray-300 focus:ring-indigo-600": !fieldState.error,
                                    "ring-red-500 focus:ring-red-500": fieldState.error,
                                    "bg-gray-200 cursor-not-allowed": disabled,
                                }
                            )}
                        />
                        <div className="text-red-500 mt-2 text-xs">
                            {fieldState.error ? fieldState.error.message : ""}
                        </div>
                    </div>
                );
            }}
        />
    );
}

export default InputField;