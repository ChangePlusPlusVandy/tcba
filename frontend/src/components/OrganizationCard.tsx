interface OrganizationCardProps {
  organization: {
    id: string;
    name: string;
    description?: string;
    city?: string;
    state?: string;
  };
}

const OrganizationCard = ({ organization }: OrganizationCardProps) => {
  return (
    <div>
      <h3>{organization.name}</h3>
      <p>{organization.description}</p>
      <p>
        {organization.city}, {organization.state}
      </p>
    </div>
  );
};

export default OrganizationCard;
