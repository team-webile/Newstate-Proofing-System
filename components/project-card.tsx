import Link from "next/link"
import Image from "next/image"

interface ProjectCardProps {
  project: {
    id: number
    project_number: string
    name: string
    description?: string
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/admin/project/${project.id}`}
      className="group block bg-neutral-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-brand-yellow transition-all"
    >
      <div className="aspect-square bg-neutral-800 flex items-center justify-center p-8">
        <Image
          src="/tent-design-mockup.jpg"
          alt={project.name}
          width={300}
          height={300}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg group-hover:text-brand-yellow transition-colors">
          {project.project_number} - {project.name}
        </h3>
      </div>
    </Link>
  )
}
