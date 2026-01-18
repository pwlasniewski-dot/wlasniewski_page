
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fixing Page ID sequence...')
    try {
        // raw query to reset the sequence
        // Note: The sequence name is usually "Page_id_seq" but Prisma might name it differently based on mapping.
        // In standard Prisma with postgres, it's typically "Page_id_seq" if the table is "Page".
        // If the table is mapped to "pages", it might be "pages_id_seq".
        // Let's safe-guess "Page_id_seq" first, or check the table name.

        // We can dynamically get the max ID first
        const maxIdResult = await prisma.page.aggregate({
            _max: {
                id: true
            }
        })

        const maxId = maxIdResult._max.id || 0
        const nextId = maxId + 1

        console.log(`Max Page ID is ${maxId}. Setting sequence to ${nextId}.`)

        // Run raw SQL to reset sequence
        // PostgreSql specific syntax
        await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Page"', 'id'), ${nextId})`)

        console.log('Sequence fixed successfully!')
    } catch (e) {
        console.error('Error fixing sequence:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
