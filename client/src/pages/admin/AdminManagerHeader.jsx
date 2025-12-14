import { Search } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"

export default function AdminManagerHeader({
  searchValue,
  searchPlaceholder,
  onSearchChange,
  buttonLabel,
  onButtonClick,
  ButtonIcon,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="pl-10"
        />
      </div>
      <Button onClick={onButtonClick} className="gap-2 whitespace-nowrap">
        {ButtonIcon && <ButtonIcon className="w-4 h-4" />}
        {buttonLabel}
      </Button>
    </div>
  )
}
