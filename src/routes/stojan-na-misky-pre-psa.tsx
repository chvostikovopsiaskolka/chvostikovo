import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Contact";
import { StandGalleryLoop } from "@/components/site/StandGalleryLoop";
import { StandVariantCards, STAND_VARIANTS } from "@/components/site/StandVariantCards";
import { StandBenefitSteps } from "@/components/site/StandBenefitSteps";
import { ProductInquirySteps } from "@/components/site/ProductInquirySteps";
import { ProductInquiryContact } from "@/components/site/ProductInquiryContact";
import { FormDialog } from "@/components/site/FormDialog";
import { SectionAmbientPaws } from "@/components/site/SectionAmbientPaws";
import { Collapse } from "@/components/site/Collapse";
import { phoneFromForm } from "@/lib/phone";
import { submitProductInquiry } from "@/lib/product-inquiry";
import type { LetterColor, StandColor, StandSize } from "@/lib/shop";
import standDark from "@/assets/products/stand-dark.webp";
import standWhite from "@/assets/products/stand-white.webp";
import standMia from "@/assets/products/stand-small-mia.webp";
