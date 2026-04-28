import Image from "next/image"

export default function Page() {
    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <Image
                src="/assets/logos/solveonyx_logo.png"
                alt="SolveOnyx"
                width={1200}
                height={320}
                className="h-auto w-[50vw] opacity-10"
                priority
            />
        </div>
    )
}
