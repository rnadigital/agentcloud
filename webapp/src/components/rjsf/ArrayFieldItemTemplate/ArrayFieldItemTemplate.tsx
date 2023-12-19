import {
  ArrayFieldTemplateItemType,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils"
import { CSSProperties } from "react"

export default function ArrayFieldItemTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: ArrayFieldTemplateItemType<T, S, F>) {
  const {
    children,
    disabled,
    hasToolbar,
    hasCopy,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    index,
    onCopyIndexClick,
    onDropIndexClick,
    onReorderClick,
    readonly,
    registry,
    uiSchema,
  } = props

  const { CopyButton, MoveDownButton, MoveUpButton, RemoveButton } =
    registry.templates.ButtonTemplates
  const btnStyle: CSSProperties = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold",
  }

  return (
    <div>
      <div className="mb-2 flex items-start">
        <div className="w-full flex-none">{children}</div>
        <div className="w-1/8 flex-none px-4">
          {hasToolbar && (
            <div className="flex mt-8">
              {(hasMoveUp || hasMoveDown) && (
                <div className="m-0 p-0">
                  <MoveUpButton
                    className="array-item-move-up"
                    style={btnStyle}
                    disabled={disabled || readonly || !hasMoveUp}
                    onClick={onReorderClick(index, index - 1)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
              {(hasMoveUp || hasMoveDown) && (
                <div className="m-0 p-0">
                  <MoveDownButton
                    style={btnStyle}
                    disabled={disabled || readonly || !hasMoveDown}
                    onClick={onReorderClick(index, index + 1)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
              {hasCopy && (
                <div className="m-0 p-0">
                  <CopyButton
                    style={btnStyle}
                    disabled={disabled || readonly}
                    onClick={onCopyIndexClick(index)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
              {hasRemove && (
                <div className="m-0 p-0">
                  <RemoveButton
                    style={btnStyle}
                    disabled={disabled || readonly}
                    onClick={onDropIndexClick(index)}
                    uiSchema={uiSchema}
                    registry={registry}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
