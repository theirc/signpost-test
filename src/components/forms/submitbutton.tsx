import { Button, ButtonProps } from "../ui/button"

export function SubmitButton({ children = "Submit", ...props }: ButtonProps) {
  return <Button {...props} >{children}</Button>
}
export function DeleteButton({ children = "Delete", ...props }: ButtonProps) {
  return <Button className="bg-rose-500" {...props} >{children}</Button>
}