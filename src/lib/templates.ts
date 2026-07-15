import design1 from '../assets/Design/Design1.png'
import design2 from '../assets/Design/Design2.png'
import design3 from '../assets/Design/Design3.png'
import design4 from '../assets/Design/Design4.png'
import minicard1F from '../assets/Minicard/Minicard1F.png'
import minicard1B from '../assets/Minicard/Minicard1B.png'
import minicard2F from '../assets/Minicard/Minicard2F.png'
import minicard2B from '../assets/Minicard/Minicard2B.png'
import minicard3F from '../assets/Minicard/Minicard3F.png'
import minicard3B from '../assets/Minicard/Minicard3B.png'
import minicard4F from '../assets/Minicard/Minicard4F.png'
import minicard4B from '../assets/Minicard/Minicard4B.png'
import minicard5F from '../assets/Minicard/Minicard5F.png'
import minicard5B from '../assets/Minicard/Minicard5B.png'
import minicard6F from '../assets/Minicard/Minicard6F.png'
import minicard6B from '../assets/Minicard/Minicard6B.png'

export type TemplateCategory = 'minicards' | 'table'

export interface TableTemplate {
  id: string
  title: string
  image: string
  canvaUrl: string
}

export interface MiniCardTemplate {
  id: string
  title: string
  front: string
  back: string
  canvaUrl: string
}

export const tableTemplates: TableTemplate[] = [
  {
    id: 'design-1',
    title: 'Дизайн 1',
    image: design1,
    canvaUrl:
      'https://www.canva.com/design/DAHPc_Knw50/f8f9FvRgG1e6pBEcZt6jTg/edit',
  },
  {
    id: 'design-2',
    title: 'Дизайн 2',
    image: design2,
    canvaUrl:
      'https://www.canva.com/design/DAHPdJw8zXI/h0eeV-ifOOzthCzWg1tCZg/edit',
  },
  {
    id: 'design-3',
    title: 'Дизайн 3',
    image: design3,
    canvaUrl:
      'https://www.canva.com/design/DAHPdRRMlIs/K0A1QuojWAMJg8irIPgMAw/edit',
  },
  {
    id: 'design-4',
    title: 'Дизайн 4',
    image: design4,
    canvaUrl:
      'https://www.canva.com/design/DAHPdV2LYlA/7rd6xT0R6jvZNS3ubUq8vw/edit',
  },
]

export const miniCardTemplates: MiniCardTemplate[] = [
  {
    id: 'minicard-1',
    title: 'Дизайн 1',
    front: minicard1F,
    back: minicard1B,
    canvaUrl:
      'https://www.canva.com/design/DAHPdYEoEOY/K6-pGmUntzV7Jp6mJZYo9g/edit',
  },
  {
    id: 'minicard-2',
    title: 'Дизайн 2',
    front: minicard2F,
    back: minicard2B,
    canvaUrl:
      'https://www.canva.com/design/DAHPdWbsL8w/HIWCmM161AntUao2PH7SDw/edit',
  },
  {
    id: 'minicard-3',
    title: 'Дизайн 3',
    front: minicard3F,
    back: minicard3B,
    canvaUrl:
      'https://www.canva.com/design/DAHPdjmlJ6k/geVGNCBAjiF9NKl368vjaA/edit',
  },
  {
    id: 'minicard-4',
    title: 'Дизайн 4',
    front: minicard4F,
    back: minicard4B,
    canvaUrl:
      'https://www.canva.com/design/DAHPd65fzlc/PSFA65yYnHQ-AQKQ9a97Jw/edit',
  },
  {
    id: 'minicard-5',
    title: 'Дизайн 5',
    front: minicard5F,
    back: minicard5B,
    canvaUrl:
      'https://www.canva.com/design/DAHPdzkk-yY/K9Yk2kCLOyPCQE3-XTlinA/edit',
  },
  {
    id: 'minicard-6',
    title: 'Дизайн 6',
    front: minicard6F,
    back: minicard6B,
    canvaUrl:
      'https://www.canva.com/design/DAHPd35PMoI/t1jRA5QXLqkwhP29jRyfUg/edit',
  },
]
