import { Button, ButtonProps } from "../ui/button"

export function SubmitButton({ submit, children = "Submit", ...props }: ButtonProps & { submit?: any }) {
  return <Button {...props} onClick={submit}>{children}</Button>
}