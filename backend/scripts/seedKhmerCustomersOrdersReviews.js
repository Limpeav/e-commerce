import "../config/env.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Product from "../models/Product.js";
import Order from "../models/orderModel.js";
import { adjustProductInventory, getAvailableStock } from "../utils/productInventory.js";
import {
  getProductImageForColor,
  normalizeSelectedSize,
} from "../utils/productOptions.js";
import { classifyReviewSentiment } from "../utils/sentiment.js";

const DEFAULT_PASSWORD = "Customer@12345";

const seededUsers = [
  {
    key: "sophea",
    name: "សុខ សុភា",
    email: "sok.sophea.customer@gmail.com",
    phone: "+85512345671",
    address: "ផ្ទះលេខ 12 ផ្លូវ 371 សង្កាត់បឹងទំពុន",
    city: "ភ្នំពេញ",
  },
  {
    key: "sreypich",
    name: "ចាន់ ស្រីពេជ្រ",
    email: "chan.sreypich.customer@gmail.com",
    phone: "+85512345672",
    address: "ផ្ទះលេខ 24 ផ្លូវ 2004 សង្កាត់កាកាប",
    city: "ភ្នំពេញ",
  },
  {
    key: "vannary",
    name: "ហេង វណ្ណារី",
    email: "heng.vannary.customer@gmail.com",
    phone: "+85512345673",
    address: "ភូមិតាខ្មៅ សង្កាត់តាខ្មៅ",
    city: "កណ្ដាល",
  },
  {
    key: "sreynang",
    name: "ម៉ៅ ស្រីនាង",
    email: "mao.sreynang.customer@gmail.com",
    phone: "+85512345674",
    address: "ផ្ទះលេខ 88 ផ្លូវជាតិលេខ 6 សង្កាត់ជ្រោយចង្វារ",
    city: "ភ្នំពេញ",
  },
  {
    key: "visal",
    name: "លឹម វិសាល",
    email: "lim.visal.customer@gmail.com",
    phone: "+85512345675",
    address: "ផ្ទះលេខ 15 ផ្លូវ 271 សង្កាត់ទឹកថ្លា",
    city: "ភ្នំពេញ",
  },
];

const products = {
  playard: {
    productId: "6a631b80275e1ac507d2741f",
    quantity: 1,
  },
  changingTable: {
    productId: "6a62d4ac3ec9823c548e9ab5",
    quantity: 1,
  },
  pajamas: {
    productId: "6a6229f6dfd62878fdf715b1",
    quantity: 1,
  },
  bathToys: {
    productId: "6a622820dfd62878fdf7148f",
    quantity: 1,
  },
  bathSeat: {
    productId: "6a622607dfd62878fdf71377",
    quantity: 1,
  },
  babyWash: {
    productId: "6a61e2a3a42c00e8e4b9d285",
    quantity: 1,
  },
  kidsShampoo: {
    productId: "6a61d41f73eef08c316a4be8",
    quantity: 1,
  },
  glowTrucks: {
    productId: "6a61cc6773eef08c316a3a34",
    quantity: 1,
  },
};

const seededOrders = [
  {
    userKey: "sophea",
    orderKey: "seed-khmer-feedback-sophea-8-products-2026-07-26",
    items: [
      {
        ...products.playard,
        color: "Beige",
        rating: 5,
        comment:
          "គ្រែនេះរៀបចំបានលឿន ហើយមានកន្លែងផ្លាស់ប្តូរខោអាវងាយស្រួល។ ពណ៌ប៊ីសស្អាត និងសាកសមសម្រាប់បន្ទប់ទារក។",
      },
      {
        ...products.changingTable,
        color: "White",
        rating: 4,
        comment:
          "តុប្តូរខោមានធ្នើផ្ទុកបានច្រើន និងមើលទៅរឹងមាំ។ កម្ពស់សមរម្យ ប៉ុន្តែពេលដំឡើងត្រូវការពេលបន្តិច។",
      },
      {
        ...products.pajamas,
        size: "6-9M",
        color: "Blue",
        rating: 3,
        comment:
          "ខោអាវគេងក្រណាត់ទន់ និងពាក់ស្រួល។ ទំហំសមល្មម ប៉ុន្តែបន្ទាប់ពីបោកមានរួញតិចៗ។",
      },
      {
        ...products.bathToys,
        rating: 2,
        comment:
          "ប្រដាប់លេងងូតទឹកទន់ តែកូនខ្ញុំមិនសូវចាប់អារម្មណ៍។ ទំហំតូចជាងដែលគិត ហើយពណ៌មិនសូវភ្លឺ។",
      },
      {
        ...products.bathSeat,
        rating: 5,
        comment:
          "កៅអីងូតទឹកជាប់អាងបានល្អ និងមានខ្នើយទន់។ វាជួយឱ្យងូតទឹកកូនមានសុវត្ថិភាព និងងាយជាងមុន។",
      },
      {
        ...products.babyWash,
        rating: 4,
        comment:
          "សាប៊ូ និងឡូសិនស្រាលលើស្បែកទារក ក្លិនទន់ និងមិនធ្វើឱ្យស្ងួត។ ខ្ញុំចង់ឱ្យដបមានទំហំធំជាងនេះបន្តិច។",
      },
      {
        ...products.kidsShampoo,
        rating: 3,
        comment:
          "សាប៊ូកក់សក់ជួយស្បែកក្បាលស្ងួតបានខ្លះៗ។ ក្លិនតែត្រី និងរ៉ូស្មែរីខ្លាំងបន្តិចសម្រាប់កូនតូច។",
      },
      {
        ...products.glowTrucks,
        rating: 2,
        comment:
          "រថយន្តមានភ្លើងស្អាត ប៉ុន្តែសំឡេងខ្លាំងពេក ហើយកូនខ្ញុំភ័យពេលបើកលេង។ គុណភាពមធ្យមប៉ុណ្ណោះ។",
      },
    ],
  },
  {
    userKey: "sreypich",
    orderKey: "seed-khmer-feedback-sreypich-8-products-2026-07-26",
    items: [
      {
        ...products.playard,
        color: "grey",
        rating: 4,
        comment:
          "គ្រែចល័តនេះងាយបត់ និងងាយយកតាមខ្លួន។ កង់រុញរលូន ប៉ុន្តែវាធ្ងន់បន្តិចពេលលើក។",
      },
      {
        ...products.changingTable,
        color: "Black",
        rating: 5,
        comment:
          "តុប្តូរខោពណ៌ខ្មៅមើលទៅស្អាត និងរឹងមាំ។ ធ្នើខាងក្រោមដាក់កន្សែង និងខោទឹកនោមបានច្រើនណាស់។",
      },
      {
        ...products.pajamas,
        size: "3-6M",
        color: "Peach and Off-white",
        rating: 2,
        comment:
          "ក្រណាត់ទន់ តែទំហំតូចជាងដែលរំពឹង។ កូនខ្ញុំពាក់បានតែរយៈពេលខ្លី ហើយដៃអាវរឹតបន្តិច។",
      },
      {
        ...products.bathToys,
        rating: 3,
        comment:
          "ប្រដាប់លេងងូតទឹកមានការរចនាបិទជិតល្អ មិនងាយចូលទឹក។ ប៉ុន្តែវាអណ្តែតមិនសូវស្ថិតស្ថេរ។",
      },
      {
        ...products.bathSeat,
        rating: 4,
        comment:
          "កៅអីងូតទឹកជួយឱ្យកូនអង្គុយបានមានសុវត្ថិភាព។ ពែងស្រូបជាប់ល្អ ប៉ុន្តែសម្អាតតាមជ្រុងត្រូវចំណាយពេល។",
      },
      {
        ...products.babyWash,
        rating: 5,
        comment:
          "សាប៊ូងូត និងឡូសិននេះសមសម្រាប់ស្បែកងាយប្រតិកម្ម។ ក្រោយប្រើ ស្បែកកូនទន់ និងមិនឡើងក្រហម។",
      },
      {
        ...products.kidsShampoo,
        rating: 2,
        comment:
          "សាប៊ូកក់សក់កាត់ស្បែកក្បាលស្ងួតមិនសូវឃើញលទ្ធផលលឿន។ ក្លិនខ្លាំង ហើយកូនខ្ញុំមិនចូលចិត្ត។",
      },
      {
        ...products.glowTrucks,
        rating: 3,
        comment:
          "រថយន្ត LED មើលទៅគួរឱ្យចាប់អារម្មណ៍ និងកង់រត់ល្អ។ តែផ្នែកប្លាស្ទិកខ្លះមើលទៅស្តើង។",
      },
    ],
  },
  {
    userKey: "vannary",
    orderKey: "seed-khmer-feedback-vannary-8-products-2026-07-26",
    items: [
      {
        ...products.playard,
        color: "Beige",
        rating: 3,
        comment:
          "គ្រែមានមុខងារច្រើន និងប្រើបានទាំងនៅផ្ទះនិងធ្វើដំណើរ។ ប៉ុន្តែការបត់ចូលកាបូបត្រូវហាត់ពីរបីដងទើបរលូន។",
      },
      {
        ...products.changingTable,
        color: "White",
        rating: 2,
        comment:
          "តុមានទំហំល្អ តែផ្នែកឈើមួយចំនួនមានស្នាមតូចៗ។ ខ្ញុំរំពឹងថាការបញ្ចប់លើផ្ទៃនឹងម៉ត់ជាងនេះ។",
      },
      {
        ...products.pajamas,
        size: "9-12M",
        color: "Blue",
        rating: 5,
        comment:
          "ខោអាវគេងនេះទន់ខ្លាំង និងមិនធ្វើឱ្យក្តៅពេក។ កូនខ្ញុំគេងស្រួល ហើយពណ៌ខៀវនៅស្អាតក្រោយបោក។",
      },
      {
        ...products.bathToys,
        rating: 4,
        comment:
          "ប្រដាប់លេងងូតទឹកកាន់ស្រួល និងមិនមានរន្ធចូលទឹក។ កូនសប្បាយពេលងូត ប៉ុន្តែចង់ឱ្យមានរូបរាងច្រើនជាងនេះ។",
      },
      {
        ...products.bathSeat,
        rating: 3,
        comment:
          "កៅអីមានខ្នើយទន់ និងជួយទប់ខ្លួនកូនបានល្អ។ សម្រាប់អាងតូច វាធំបន្តិច ហើយត្រូវរៀបចំទីតាំងឱ្យត្រឹមត្រូវ។",
      },
      {
        ...products.babyWash,
        rating: 2,
        comment:
          "ឡូសិនផ្តល់សំណើមបាន តែក្លិនមិនត្រូវចិត្តខ្ញុំ។ ក្រោយប្រើ ស្បែកកូនមិនមានបញ្ហា តែមិនសូវចង់ទិញម្តងទៀត។",
      },
      {
        ...products.kidsShampoo,
        rating: 5,
        comment:
          "សាប៊ូនេះលាងសក់ស្អាត និងជួយស្បែកក្បាលស្ងួតបានល្អ។ ក្រោយប្រើពីរបីដង សក់កូនទន់ និងមិនសូវមានសំណល់។",
      },
      {
        ...products.glowTrucks,
        rating: 4,
        comment:
          "រថយន្តភ្លើង LED គួរឱ្យសប្បាយ និងកូនខ្ញុំចូលចិត្តរត់លើកម្រាល។ សំឡេងខ្លាំងបន្តិច ប៉ុន្តែលេងបានរឹងមាំ។",
      },
    ],
  },
  {
    userKey: "sreynang",
    orderKey: "seed-khmer-feedback-sreynang-8-products-2026-07-26",
    items: [
      {
        ...products.playard,
        color: "grey",
        rating: 2,
        comment:
          "គ្រែមានគ្រឿងច្រើន តែខ្ញុំមានអារម្មណ៍ថាដំឡើងមិនងាយដូចការពណ៌នា។ កាបូបផ្ទុកក៏តឹងពេលដាក់ចូលវិញ។",
      },
      {
        ...products.changingTable,
        color: "Black",
        rating: 3,
        comment:
          "តុប្តូរខោប្រើបានល្អសម្រាប់ដាក់សម្ភារៈទារក។ ទោះយ៉ាងណា ផ្ទៃខាងលើងាយឃើញធូលីលើពណ៌ខ្មៅ។",
      },
      {
        ...products.pajamas,
        size: "12-18M",
        color: "Peach and Off-white",
        rating: 4,
        comment:
          "ខោអាវគេងទន់ និងសាច់ក្រណាត់យឺតល្អ។ ពណ៌ស្រទន់ស្អាត ប៉ុន្តែគួរមានជម្រើសលំនាំច្រើនទៀត។",
      },
      {
        ...products.bathToys,
        rating: 5,
        comment:
          "ប្រដាប់លេងងូតទឹកនេះល្អណាស់ ព្រោះគ្មានរន្ធឱ្យទឹកចូល។ កូនខ្ញុំចូលចិត្តកាន់ ហើយសម្អាតក៏ងាយ។",
      },
      {
        ...products.bathSeat,
        rating: 2,
        comment:
          "កៅអីជួយទប់កូនបាន ប៉ុន្តែពែងស្រូបមួយចំនួនមិនសូវជាប់លើអាងរបស់ខ្ញុំ។ ខ្ញុំត្រូវពិនិត្យជានិច្ចពេលប្រើ។",
      },
      {
        ...products.babyWash,
        rating: 3,
        comment:
          "សាប៊ូងូតស្រាល និងមិនធ្វើឱ្យស្បែកកូនស្ងួត។ តែឡូសិនស្រូបចូលយឺតបន្តិច បើប្រើច្រើនពេក។",
      },
      {
        ...products.kidsShampoo,
        rating: 4,
        comment:
          "សាប៊ូកក់សក់លាងសំណល់បានស្អាត និងសាកសមសម្រាប់ស្បែកក្បាលស្ងួត។ ក្លិនធម្មជាតិខ្លាំងបន្តិចប៉ុន្តែទទួលយកបាន។",
      },
      {
        ...products.glowTrucks,
        rating: 5,
        comment:
          "រថយន្តភ្លើងនេះធ្វើឱ្យកូនសប្បាយខ្លាំង។ ភ្លើងភ្លឺ កង់រត់រលូន ហើយទំហំសមសម្រាប់ដៃកូនតូច។",
      },
    ],
  },
  {
    userKey: "visal",
    orderKey: "seed-khmer-feedback-visal-8-products-2026-07-26",
    items: [
      {
        ...products.playard,
        color: "Beige",
        rating: 5,
        comment:
          "គ្រែ 6-in-1 មានអ្វីដែលត្រូវការសម្រាប់ទារកទាំងអស់។ ការរៀបចំរហ័ស កង់ងាយរុញ និងកន្លែងប្តូរខោមានប្រយោជន៍ណាស់។",
      },
      {
        ...products.changingTable,
        color: "White",
        rating: 3,
        comment:
          "តុប្តូរខោមានកម្ពស់ល្អ និងធ្នើទុករបស់បានច្រើន។ ប៉ុន្តែវាមិនសូវសមសម្រាប់បន្ទប់តូច ព្រោះទំហំធំបន្តិច។",
      },
      {
        ...products.pajamas,
        size: "18-24M",
        color: "Blue",
        rating: 2,
        comment:
          "ខោអាវគេងទន់ តែថ្នេរខ្លះរឹងបន្តិចជិតក។ កូនខ្ញុំមិនសូវស្រួលពាក់ពេលគេងយូរ។",
      },
      {
        ...products.bathToys,
        rating: 4,
        comment:
          "ប្រដាប់លេងទឹកមិនងាយដុះផ្សិត និងកូនចូលចិត្តបោះអណ្តែត។ បើមានថង់ផ្ទុកមកជាមួយ នឹងល្អជាងនេះ។",
      },
      {
        ...products.bathSeat,
        rating: 5,
        comment:
          "កៅអីងូតទឹកនេះមានស្ថេរភាពល្អ និងខ្នើយទន់។ វាជួយឱ្យខ្ញុំងូតទឹកកូនបានងាយ និងមានទំនុកចិត្ត។",
      },
      {
        ...products.babyWash,
        rating: 3,
        comment:
          "សាប៊ូ និងឡូសិនប្រើបានល្អសម្រាប់ស្បែកទារក។ លទ្ធផលសំណើមមធ្យម ហើយត្រូវលាបឡូសិនបន្ថែមនៅពេលអាកាសស្ងួត។",
      },
      {
        ...products.kidsShampoo,
        rating: 2,
        comment:
          "សាប៊ូកក់សក់នេះមិនសូវសមសម្រាប់កូនខ្ញុំ ព្រោះក្លិនខ្លាំង និងសក់ស្ងួតបន្តិចក្រោយលាង។",
      },
      {
        ...products.glowTrucks,
        rating: 4,
        comment:
          "រថយន្ត LED រត់ល្អ និងរចនារូបសត្វគួរឱ្យចូលចិត្ត។ កូនលេងរាល់ថ្ងៃ ប៉ុន្តែខ្ញុំចង់ឱ្យមានប៊ូតុងកាត់សំឡេង។",
      },
    ],
  },
];

const additionalKhmerUsers = [
  {
    key: "daravuth",
    name: "ពៅ ដារ៉ាវុធ",
    email: "pov.daravuth.customer@gmail.com",
    phone: "+85512345676",
    address: "ផ្ទះលេខ 31 ផ្លូវ 598 សង្កាត់បឹងកក់",
    city: "ភ្នំពេញ",
  },
  {
    key: "monyroth",
    name: "នួន មុនីរដ្ឋ",
    email: "noun.monyroth.customer@gmail.com",
    phone: "+85512345677",
    address: "ផ្ទះលេខ 42 ផ្លូវ 163 សង្កាត់ទួលទំពូង",
    city: "ភ្នំពេញ",
  },
  {
    key: "kimsan",
    name: "យឹម គឹមសាន",
    email: "yim.kimsan.customer@gmail.com",
    phone: "+85512345678",
    address: "ភូមិព្រែកតាទែន ឃុំព្រែកអញ្ចាញ",
    city: "កណ្ដាល",
  },
  {
    key: "sotheara",
    name: "ឃឹម សុធារ៉ា",
    email: "khim.sotheara.customer@gmail.com",
    phone: "+85512345679",
    address: "ផ្ទះលេខ 9 ផ្លូវ 60 ម៉ែត្រ សង្កាត់ចាក់អង្រែក្រោម",
    city: "ភ្នំពេញ",
  },
  {
    key: "rachana",
    name: "ទេព រចនា",
    email: "tep.rachana.customer@gmail.com",
    phone: "+85512345680",
    address: "ផ្ទះលេខ 53 ផ្លូវលេខ 7 ភូមិវត្តបូព៌",
    city: "សៀមរាប",
  },
  {
    key: "pisey",
    name: "សែន ពិសី",
    email: "sen.pisey.customer@gmail.com",
    phone: "+85512345681",
    address: "ផ្ទះលេខ 27 ផ្លូវលេខ 3 សង្កាត់ស្វាយប៉ោ",
    city: "បាត់ដំបង",
  },
  {
    key: "narith",
    name: "ហ៊ុល ណារិទ្ធ",
    email: "hul.narith.customer@gmail.com",
    phone: "+85512345682",
    address: "ផ្ទះលេខ 18 ផ្លូវឯករាជ្យ សង្កាត់លេខ 4",
    city: "ព្រះសីហនុ",
  },
  {
    key: "sovann",
    name: "ជា សុវណ្ណ",
    email: "chea.sovann.customer@gmail.com",
    phone: "+85512345683",
    address: "ភូមិអូរឬស្សី សង្កាត់អូរឬស្សី",
    city: "កំពង់ចាម",
  },
  {
    key: "leakena",
    name: "អ៊ុក លក្ខិណា",
    email: "uk.leakena.customer@gmail.com",
    phone: "+85512345684",
    address: "ផ្ទះលេខ 64 ផ្លូវលេខ 2 សង្កាត់កំពង់កណ្ដាល",
    city: "កំពត",
  },
];

const additionalProducts = {
  hairBrush: {
    productId: "6a0bfaa10a3672ad80b8a4eb",
    quantity: 1,
  },
  hoodedTowel: {
    productId: "6a03f9d2089e87bd0c5df396",
    quantity: 1,
  },
  wetWipes: {
    productId: "6a60ab35e285662b32f50249",
    quantity: 1,
  },
  kitchenPlayset: {
    productId: "6a61abe171f842720d78fcba",
    quantity: 1,
  },
  formulaMilk: {
    productId: "6a02c033856b4a1f0f0c3fd6",
    quantity: 1,
  },
  bottleSet: {
    productId: "6a02ca7c856b4a1f0f0c4562",
    quantity: 1,
  },
  carSeat: {
    productId: "6a02cff254f7d0ddac6bd5b7",
    quantity: 1,
  },
  babyWalker: {
    productId: "6a16aa6a1f030681f86597b9",
    quantity: 1,
  },
};

const additionalProductKeys = [
  "hairBrush",
  "hoodedTowel",
  "wetWipes",
  "kitchenPlayset",
  "formulaMilk",
  "bottleSet",
  "carSeat",
  "babyWalker",
];

const additionalRatingPattern = [5, 4, 3, 2, 5, 4, 3, 2];

const additionalReviewComments = {
  hairBrush: {
    2: "ជក់សក់ទន់ តែដៃកាន់តូចបន្តិច ហើយសក់ជក់ជ្រុះខ្លះៗពេលប្រើលើកដំបូង។ សម្រាប់ខ្ញុំ គុណភាពមិនសូវសមតម្លៃ។",
    3: "ជក់សក់ទារកនេះទន់ល្មម និងមិនធ្វើឱ្យស្បែកក្បាលកូនឈឺ។ ប៉ុន្តែវាតូចបន្តិច សម្រាប់កាន់ប្រើរាល់ថ្ងៃ។",
    4: "ជក់សក់ទន់ និងសាកសមសម្រាប់ស្បែកក្បាលទារក។ ដៃកាន់ស្រួល ប៉ុន្តែបើមានប្រអប់ផ្ទុកមកជាមួយនឹងល្អជាងនេះ។",
    5: "ជក់សក់នេះទន់ខ្លាំង និងអាចសិតសក់កូនបានស្អាតដោយមិនធ្វើឱ្យកូនរំខាន។ ខ្ញុំពេញចិត្តសម្រាប់ទារកទើបកើត។",
  },
  hoodedTowel: {
    2: "កន្សែងមានមួកគួរឱ្យស្រឡាញ់ តែសាច់ក្រណាត់ស្តើងជាងដែលរំពឹង។ ក្រោយបោក វារឹងបន្តិច និងស្រូបទឹកមិនសូវល្អ។",
    3: "កន្សែងងូតទឹកមានមួកទំហំសមរម្យ និងរុំកូនបានងាយ។ ស្រូបទឹកបានមធ្យម ប៉ុន្តែសាច់ក្រណាត់មិនទន់ខ្លាំងទេ។",
    4: "កន្សែងទន់ ស្រូបទឹកល្អ និងមួកជួយឱ្យក្បាលកូនកក់ក្តៅក្រោយងូតទឹក។ តែចង់ឱ្យវាធំជាងនេះបន្តិច។",
    5: "កន្សែងមានមួកនេះទន់ណាស់ ស្រូបទឹកលឿន និងរុំកូនបានកក់ក្តៅ។ បន្ទាប់ពីបោកក៏នៅតែទន់ល្អ។",
  },
  wetWipes: {
    2: "ក្រដាសជូតសើមគ្មានក្លិន ប៉ុន្តែសន្លឹកស្តើង និងងាយដាច់ពេលទាញ។ ខ្ញុំត្រូវប្រើច្រើនសន្លឹកក្នុងមួយដង។",
    3: "ក្រដាសជូតសើមប្រើបានសម្រាប់ប្រចាំថ្ងៃ និងមិនមានក្លិនខ្លាំង។ តែសំណើមមធ្យម ហើយសន្លឹកខ្លះជាប់គ្នាពេលទាញ។",
    4: "ក្រដាសជូតសើមទន់ មិនមានក្លិន និងសាកសមសម្រាប់ស្បែកទារក។ កញ្ចប់ធំប្រើបានយូរ ប៉ុន្តែគំរបបិទត្រូវប្រយ័ត្ន។",
    5: "ក្រដាសជូតសើមនេះទន់ សើមល្មម និងមិនធ្វើឱ្យស្បែកកូនក្រហម។ កញ្ចប់ 8 ដុំសន្សំសំចៃល្អណាស់។",
  },
  kitchenPlayset: {
    2: "ឈុតផ្ទះបាយមានគ្រឿងច្រើន តែប្លាស្ទិកខ្លះស្តើង និងពណ៌មិនសូវស្អាតដូចរូប។ កូនលេងបាន តែខ្ញុំមិនសូវពេញចិត្ត។",
    3: "ឈុតផ្ទះបាយមានរបស់លេងច្រើន និងកូនអាចលេងធ្វើម្ហូបបាន។ គុណភាពមធ្យម ហើយគ្រឿងតូចៗត្រូវរក្សាឱ្យល្អ។",
    4: "ឈុតផ្ទះបាយលេងបានសប្បាយ និងជួយឱ្យកូនរៀនធ្វើតាមការចម្អិន។ គ្រឿងច្រើន ប៉ុន្តែប្រអប់ផ្ទុកគួរតែរឹងជាងនេះ។",
    5: "ឈុតផ្ទះបាយនេះល្អណាស់ គ្រឿងច្រើន ពណ៌ស្អាត និងកូនលេងបានយូរ។ សមសម្រាប់កុមារចូលចិត្តលេងធ្វើម្ហូប។",
  },
  formulaMilk: {
    2: "ម្សៅទឹកដោះគោរលាយមិនសូវលឿន និងកូនខ្ញុំមិនសូវចូលចិត្តរសជាតិ។ ខ្ញុំប្រើបានតិច ហើយមិនសូវចង់ទិញបន្ត។",
    3: "ម្សៅទឹកដោះគោប្រើបានធម្មតា និងកូនផឹកបានខ្លះៗ។ រលាយត្រូវកូរយូរបន្តិច ហើយក្លិនខ្លាំងបន្តិច។",
    4: "ម្សៅទឹកដោះគោរលាយបានល្អ និងកូនផឹកបានស្រួល។ កំប៉ុងបិទបានជិត ប៉ុន្តែតម្លៃខ្ពស់បន្តិច។",
    5: "ទឹកដោះគោម្សៅនេះរលាយលឿន កូនផឹកបានល្អ និងមិនមានបញ្ហាពោះ។ ការវេចខ្ចប់ស្អាត និងងាយរក្សាទុក។",
  },
  bottleSet: {
    2: "ឈុតដបបំបៅមានទំហំល្អ តែក្បាលដបហូរលឿនពេកសម្រាប់កូនខ្ញុំ។ ពេលលាងក៏មានជ្រុងពិបាកសម្អាតខ្លះ។",
    3: "ដបបំបៅកូនប្រើបានល្អមធ្យម និងកាន់ស្រួល។ ក្បាលដបស៊ីលីកូនទន់ ប៉ុន្តែហូរមិនសូវស្មើគ្នា។",
    4: "ឈុតដបបំបៅគ្មាន BPA និងងាយកាន់។ កូនផឹកបានល្អ ប៉ុន្តែគួរមានជក់លាងដបបន្ថែមក្នុងកញ្ចប់។",
    5: "ដបបំបៅកូននេះល្អណាស់ ក្បាលដបទន់ ហូរល្មម និងងាយលាងសម្អាត។ ឈុតនេះសមសម្រាប់ប្រើរាល់ថ្ងៃ។",
  },
  carSeat: {
    2: "កៅអីរថយន្តមើលទៅរឹងមាំ តែខ្សែរឹតកែតម្រូវពិបាក និងទម្ងន់ធ្ងន់ពេលលើក។ ខ្ញុំរំពឹងថាប្រើងាយជាងនេះ។",
    3: "កៅអីរថយន្តមានទ្រនាប់ទន់ និងទំហំសមសម្រាប់ទារក។ ប៉ុន្តែការដំឡើងក្នុងរថយន្តត្រូវចំណាយពេល និងអានណែនាំច្បាស់។",
    4: "កៅអីរថយន្តទារកមានទ្រនាប់ស្រួល និងខ្សែសុវត្ថិភាពល្អ។ ទម្ងន់ធ្ងន់បន្តិច ប៉ុន្តែមានអារម្មណ៍រឹងមាំ។",
    5: "កៅអីរថយន្តនេះមានសុវត្ថិភាព និងទារកអង្គុយស្រួល។ ខ្សែរឹតកាន់បានល្អ ហើយងាយយកតាមខ្លួនពេលចេញក្រៅ។",
  },
  babyWalker: {
    2: "រទេះហាត់ដើរមានភ្លេង តែសំឡេងខ្លាំងពេក និងកង់រត់លឿនសម្រាប់កូនតូច។ ខ្ញុំត្រូវឈរមើលជិតពេលប្រើ។",
    3: "រទេះហាត់ដើរជួយឱ្យកូនចង់ឈរ និងមានភ្លេងកម្សាន្ត។ ប៉ុន្តែកៅអីមិនសូវទន់ និងត្រូវការកន្លែងធំ។",
    4: "រទេះហាត់ដើរមានភ្លេងសប្បាយ និងកង់រត់រលូន។ កូនចូលចិត្តប្រើ ប៉ុន្តែបើអាចកែសំឡេងបានច្រើនកម្រិតនឹងល្អ។",
    5: "រទេះហាត់ដើរនេះរឹងមាំ មានភ្លេងទាក់ទាញ និងជួយឱ្យកូនហាត់ដើរបានសប្បាយ។ កៅអីសមល្មម និងងាយសម្អាត។",
  },
};

seededUsers.push(...additionalKhmerUsers);
seededOrders.push(
  ...additionalKhmerUsers.map((userSeed, userIndex) => ({
    userKey: userSeed.key,
    orderKey: `seed-khmer-feedback-${userSeed.key}-batch2-8-products-2026-07-26`,
    items: additionalProductKeys.map((productKey, productIndex) => {
      const rating =
        additionalRatingPattern[
          (productIndex + userIndex) % additionalRatingPattern.length
        ];

      return {
        ...additionalProducts[productKey],
        rating,
        comment: additionalReviewComments[productKey][rating],
      };
    }),
  }))
);

const getEffectivePrice = (product) => {
  const price = Number(product.price || 0);
  const discountPrice = Number(product.discountPrice || 0);
  return discountPrice > 0 && discountPrice < price ? discountPrice : price;
};

const syncProductReviewStats = (product) => {
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.length
    ? product.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      product.reviews.length
    : 0;
};

const ensureUser = async (userSeed) => {
  let user = await User.findOne({ email: userSeed.email });

  if (!user) {
    user = new User({
      name: userSeed.name,
      email: userSeed.email,
      password: DEFAULT_PASSWORD,
      phone: userSeed.phone,
      role: "user",
      isAdmin: false,
      isVerified: true,
    });
    await user.save();
    return { user, created: true };
  }

  user.name = userSeed.name;
  user.phone = userSeed.phone;
  user.role = "user";
  user.isAdmin = false;
  user.isVerified = true;
  await user.save();
  return { user, created: false };
};

const buildOrderItems = async (orderSeed) => {
  const items = [];
  const products = [];

  for (const itemSeed of orderSeed.items) {
    const product = await Product.findById(itemSeed.productId);
    if (!product) {
      throw new Error(`Product not found: ${itemSeed.productId}`);
    }

    const size = normalizeSelectedSize(itemSeed.size || "");
    const color = String(itemSeed.color || "").trim();
    const availableStock = getAvailableStock(product, size, color);
    if (availableStock < itemSeed.quantity) {
      throw new Error(
        `${product.title} only has ${availableStock} available for ${size || color || "standard"}`
      );
    }

    items.push({
      product: product._id,
      name: product.title,
      titleKm: product.titleKm || "",
      quantity: itemSeed.quantity,
      size,
      color,
      image: getProductImageForColor(product, color),
      price: getEffectivePrice(product),
    });
    products.push({ product, itemSeed, size, color });
  }

  return { items, products };
};

const reducePurchasedStock = async (products) => {
  for (const { product, itemSeed, size, color } of products) {
    adjustProductInventory(product, {
      size,
      color,
      quantity: itemSeed.quantity,
      action: "reduce",
    });
    product.totalSold = Number(product.totalSold || 0) + Number(itemSeed.quantity || 0);
    await product.save();
  }
};

const ensureDeliveredOrder = async (userSeed, user, orderSeed) => {
  const existingOrder = await Order.findOne({ "paymentResult.id": orderSeed.orderKey });
  if (existingOrder) {
    return { order: existingOrder, created: false };
  }

  const { items, products } = await buildOrderItems(orderSeed);
  const totalPrice = items.reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const deliveredAt = new Date();

  const order = await Order.create({
    user: user._id,
    orderItems: items,
    shippingAddress: {
      fullName: userSeed.name,
      address: userSeed.address,
      city: userSeed.city,
      country: "Cambodia",
      phone: userSeed.phone,
    },
    paymentMethod: "Cash on Delivery",
    paymentResult: {
      id: orderSeed.orderKey,
      status: "Paid",
      update_time: deliveredAt.toISOString(),
      email_address: user.email,
    },
    taxPrice: 0,
    shippingPrice: 0,
    totalPrice,
    orderStatus: "Delivered",
    paymentStatus: "Paid",
    isPaid: true,
    paidAt: deliveredAt,
    processedAt: deliveredAt,
    shippedAt: deliveredAt,
    isDelivered: true,
    deliveredAt,
    stockReduced: true,
    stockReserved: false,
    stockRestored: false,
  });

  await reducePurchasedStock(products);
  return { order, created: true };
};

const upsertReview = async ({ user, order, itemSeed }) => {
  const product = await Product.findById(itemSeed.productId);
  if (!product) {
    throw new Error(`Product not found for review: ${itemSeed.productId}`);
  }

  const rating = Math.max(2, Math.min(5, Number(itemSeed.rating || 5)));
  const sentiment = classifyReviewSentiment({ rating, comment: itemSeed.comment });
  const analyzedAt = new Date();
  const existingReview = product.reviews.find(
    (review) => review.user.toString() === user._id.toString()
  );

  if (existingReview) {
    existingReview.name = user.name;
    existingReview.rating = rating;
    existingReview.comment = itemSeed.comment;
    existingReview.commentKm = itemSeed.comment;
    existingReview.sentimentLabel = sentiment.label;
    existingReview.sentimentScore = sentiment.score;
    existingReview.sentimentAnalyzedAt = analyzedAt;
    existingReview.order = order._id;
  } else {
    product.reviews.push({
      name: user.name,
      rating,
      comment: itemSeed.comment,
      commentKm: itemSeed.comment,
      sentimentLabel: sentiment.label,
      sentimentScore: sentiment.score,
      sentimentAnalyzedAt: analyzedAt,
      user: user._id,
      order: order._id,
    });
  }

  syncProductReviewStats(product);
  await product.save();

  return {
    productId: product._id.toString(),
    title: product.title,
    rating,
    updated: Boolean(existingReview),
  };
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const usersByKey = new Map();
  const summary = {
    users: [],
    orders: [],
    reviews: [],
    defaultPassword: DEFAULT_PASSWORD,
  };

  for (const userSeed of seededUsers) {
    const { user, created } = await ensureUser(userSeed);
    usersByKey.set(userSeed.key, { userSeed, user });
    summary.users.push({
      created,
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    });
  }

  for (const orderSeed of seededOrders) {
    const seededUser = usersByKey.get(orderSeed.userKey);
    if (!seededUser) {
      throw new Error(`Missing user seed for ${orderSeed.userKey}`);
    }

    const { order, created } = await ensureDeliveredOrder(
      seededUser.userSeed,
      seededUser.user,
      orderSeed
    );
    summary.orders.push({
      created,
      id: order._id.toString(),
      user: seededUser.user.name,
      itemCount: order.orderItems.length,
      totalPrice: order.totalPrice,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
    });

    for (const itemSeed of orderSeed.items) {
      summary.reviews.push(
        await upsertReview({
          user: seededUser.user,
          order,
          itemSeed,
        })
      );
    }
  }

  console.log(JSON.stringify(summary, null, 2));
};

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
