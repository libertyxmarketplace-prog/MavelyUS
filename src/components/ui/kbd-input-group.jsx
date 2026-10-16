import React from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Search } from "lucide-react";

export function KbdInputGroup({ placeholder = "Search...", onSearch, className = "" }) {
  return (
    <div className={`flex w-full max-w-xs flex-col ${className}`}>
      <InputGroup>
        <InputGroupAddon>
          <Search className="size-3.5 text-zinc-500" />
        </InputGroupAddon>
        <InputGroupInput 
          placeholder={placeholder}
          onChange={(e) => onSearch?.(e.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

export default KbdInputGroup;
