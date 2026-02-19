namespace api.DTOs.Webhooks
{
    // DTO raiz do webhook v2.0.0
    public class HotmartWebhookV2Dto
    {
        public string? Id { get; set; }
        public long? CreationDate { get; set; }
        public string? Event { get; set; }  // "PURCHASE_COMPLETE" ou "PURCHASE_APPROVED"
        public string? Version { get; set; }
        public HotmartWebhookDataDto? Data { get; set; }
        public string? Hottok { get; set; }
    }

    public class HotmartWebhookDataDto
    {
        public HotmartProductDataDto? Product { get; set; }
        public List<HotmartAffiliateDto>? Affiliates { get; set; }
        public HotmartBuyerDto? Buyer { get; set; }
        public HotmartProducerDto? Producer { get; set; }
        public List<HotmartCommissionDto>? Commissions { get; set; }
        public HotmartPurchaseDataDto? Purchase { get; set; }
        public HotmartSubscriptionDataDto? Subscription { get; set; }
    }

    public class HotmartProductDataDto
    {
        public int Id { get; set; }
        public string? Ucode { get; set; }
        public string? Name { get; set; }
        public DateTime? WarrantyDate { get; set; }   // ← aqui está a data de garantia
        public string? SupportEmail { get; set; }
        public bool HasCoProduction { get; set; }
        public bool IsPhysicalProduct { get; set; }
        public HotmartContentDto? Content { get; set; }
    }

    public class HotmartContentDto
    {
        public bool HasPhysicalProducts { get; set; }
        public List<HotmartPhysicalProductDto>? Products { get; set; }
    }

    public class HotmartPhysicalProductDto
    {
        public int Id { get; set; }
        public string? Ucode { get; set; }
        public string? Name { get; set; }
        public bool IsPhysicalProduct { get; set; }
    }

    public class HotmartBuyerDto
    {
        public string? Email { get; set; }
        public string? Name { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? CheckoutPhoneCode { get; set; }
        public string? CheckoutPhone { get; set; }     // telefone completo
        public HotmartAddressDto? Address { get; set; }
        public string? Document { get; set; }
        public string? DocumentType { get; set; }      // "CPF"
    }

    public class HotmartAddressDto
    {
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? CountryIso { get; set; }
        public string? State { get; set; }
        public string? Neighborhood { get; set; }
        public string? Zipcode { get; set; }
        public string? Address { get; set; }
        public string? Number { get; set; }
        public string? Complement { get; set; }
    }

    // Campos mínimos para os outros (pode expandir depois)
    public class HotmartAffiliateDto { /* ... */ }
    public class HotmartProducerDto { /* ... */ }
    public class HotmartCommissionDto { /* ... */ }
    public class HotmartPurchaseDataDto { /* ... */ }
    public class HotmartSubscriptionDataDto { /* ... */ }
}