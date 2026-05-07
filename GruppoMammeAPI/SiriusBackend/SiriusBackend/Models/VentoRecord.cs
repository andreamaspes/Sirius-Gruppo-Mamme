using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CsvHelper.Configuration.Attributes;

namespace SiriusBackend.Models
{
    public class VentoRecord
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Name("Data")]
        public DateTime Data { get; set; }

        [Name("Windspeed")]
        [Column("Windspeed")]
        public decimal Windspeed { get; set; }
    }
}
