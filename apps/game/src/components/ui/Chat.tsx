import * as React from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const tags = Array.from({ length: 50 }).map(
    (_, i, a) => `v1.2.0-beta.${a.length - i}`
)

export function Chat() {
    return (
        <div className="flex flex-col items-end justify-center mx-5">
            <ScrollArea className="h-[500px] w-full rounded-md border">
                <div className="p-4">
                    <h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
                    {tags.map((tag) => (
                        <React.Fragment key={tag}>
                            <div className="text-sm">{tag}</div>
                            <Separator className="my-2" />
                        </React.Fragment>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
